package services

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"ip-lookup/models"

	"github.com/hashicorp/golang-lru/v2/expirable"
)

func TestValidateIP(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)
	service := NewIPLocateService(cache)

	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		// Valid IPv4
		{name: "valid IPv4 - 8.8.8.8", ip: "8.8.8.8", wantErr: false},
		{name: "valid IPv4 - 192.168.1.1", ip: "192.168.1.1", wantErr: false},
		{name: "valid IPv4 - 255.255.255.255", ip: "255.255.255.255", wantErr: false},
		{name: "valid IPv4 - 0.0.0.0", ip: "0.0.0.0", wantErr: false},
		{name: "valid IPv4 - 10.0.0.1", ip: "10.0.0.1", wantErr: false},

		// Valid IPv6
		{name: "valid IPv6 - loopback", ip: "::1", wantErr: false},
		{name: "valid IPv6 - 2001:db8::1", ip: "2001:db8::1", wantErr: false},
		{name: "valid IPv6 - full format", ip: "2001:0db8:0000:0000:0000:0000:0000:0001", wantErr: false},
		{name: "valid IPv6 - fe80::1", ip: "fe80::1", wantErr: false},

		// Invalid
		{name: "invalid - empty string", ip: "", wantErr: true},
		{name: "invalid - domain", ip: "example.com", wantErr: true},
		{name: "invalid - partial IPv4", ip: "192.168.1", wantErr: true},
		{name: "invalid - IPv4 out of range", ip: "256.1.1.1", wantErr: true},
		{name: "invalid - CIDR notation", ip: "192.168.1.0/24", wantErr: true},
		{name: "invalid - with port", ip: "192.168.1.1:8080", wantErr: true},
		{name: "invalid - random string", ip: "not-an-ip", wantErr: true},
		{name: "invalid - negative number", ip: "-1.0.0.0", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateIP(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateIP(%q) error = %v, wantErr %v", tt.ip, err, tt.wantErr)
			}
		})
	}
}

func TestLookup_CacheHit(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	// Pre-populate cache
	cachedResult := &models.LookupResponse{
		IP:          "8.8.8.8",
		Country:     "United States",
		CountryCode: "US",
		City:        "Mountain View",
		Timezone:    "America/Los_Angeles",
	}
	cache.Add("8.8.8.8", cachedResult)

	service := NewIPLocateService(cache)

	result, err := service.Lookup("8.8.8.8")
	if err != nil {
		t.Fatalf("Lookup returned unexpected error: %v", err)
	}

	if result != cachedResult {
		t.Error("Expected cached result to be returned")
	}
}

func TestLookup_CacheMiss(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	// Create mock server
	mockResponse := models.IPLocateResponse{
		IP:          "8.8.8.8",
		Country:     "United States",
		CountryCode: "US",
		City:        "Mountain View",
		Timezone:    "America/Los_Angeles",
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/8.8.8.8" {
			t.Errorf("Expected path /8.8.8.8, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	service := NewIPLocateService(cache, WithBaseURL(server.URL))

	result, err := service.Lookup("8.8.8.8")
	if err != nil {
		t.Fatalf("Lookup returned unexpected error: %v", err)
	}

	if result.IP != "8.8.8.8" {
		t.Errorf("Expected IP 8.8.8.8, got %s", result.IP)
	}
	if result.Country != "United States" {
		t.Errorf("Expected Country 'United States', got %s", result.Country)
	}
	if result.CountryCode != "US" {
		t.Errorf("Expected CountryCode 'US', got %s", result.CountryCode)
	}

	// Verify result was cached
	cached, found := cache.Get("8.8.8.8")
	if !found {
		t.Error("Expected result to be cached")
	}
	if cached.IP != "8.8.8.8" {
		t.Error("Cached result does not match")
	}
}

func TestLookup_APIError(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	service := NewIPLocateService(cache, WithBaseURL(server.URL))

	_, err := service.Lookup("8.8.8.8")
	if err == nil {
		t.Error("Expected error for API failure")
	}
}

func TestLookup_APIErrorResponse(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.IPLocateResponse{
			Error: "Invalid IP address",
		})
	}))
	defer server.Close()

	service := NewIPLocateService(cache, WithBaseURL(server.URL))

	_, err := service.Lookup("invalid")
	if err == nil {
		t.Error("Expected error for API error response")
	}
	if err.Error() != "API error: Invalid IP address" {
		t.Errorf("Unexpected error message: %v", err)
	}
}

func TestLookup_InvalidJSON(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("invalid json"))
	}))
	defer server.Close()

	service := NewIPLocateService(cache, WithBaseURL(server.URL))

	_, err := service.Lookup("8.8.8.8")
	if err == nil {
		t.Error("Expected error for invalid JSON response")
	}
}

func TestNewIPLocateService_WithOptions(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)
	customClient := &http.Client{Timeout: 5 * time.Second}

	service := NewIPLocateService(cache,
		WithBaseURL("https://custom.api.com"),
		WithHTTPClient(customClient),
	)

	if service.baseURL != "https://custom.api.com" {
		t.Errorf("Expected custom base URL, got %s", service.baseURL)
	}
	if service.client != customClient {
		t.Error("Expected custom HTTP client")
	}
}

func TestNewIPLocateService_DefaultValues(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)

	service := NewIPLocateService(cache)

	if service.baseURL != defaultBaseURL {
		t.Errorf("Expected default base URL %s, got %s", defaultBaseURL, service.baseURL)
	}
	if service.client == nil {
		t.Error("Expected default HTTP client to be set")
	}
}

func TestIPLocateServiceImplementsGeoService(t *testing.T) {
	cache := expirable.NewLRU[string, *models.LookupResponse](100, nil, time.Hour)
	service := NewIPLocateService(cache)

	// Verify IPLocateService implements GeoService
	var _ GeoService = service
}
