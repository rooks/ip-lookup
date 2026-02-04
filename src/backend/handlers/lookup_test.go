package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"ip-lookup/models"
)

type MockGeoService struct {
	ValidateIPFunc func(ip string) error
	LookupFunc     func(ip string) (*models.LookupResponse, error)
}

func (m *MockGeoService) ValidateIP(ip string) error {
	if m.ValidateIPFunc != nil {
		return m.ValidateIPFunc(ip)
	}
	return nil
}

func (m *MockGeoService) Lookup(ip string) (*models.LookupResponse, error) {
	if m.LookupFunc != nil {
		return m.LookupFunc(ip)
	}
	return nil, nil
}

func TestHandleLookup_Success(t *testing.T) {
	mockService := &MockGeoService{
		ValidateIPFunc: func(ip string) error {
			return nil
		},
		LookupFunc: func(ip string) (*models.LookupResponse, error) {
			return &models.LookupResponse{
				IP:          ip,
				Country:     "United States",
				CountryCode: "US",
				City:        "Mountain View",
				Timezone:    "America/Los_Angeles",
			}, nil
		},
	}

	handler := NewLookupHandler(mockService)

	req := httptest.NewRequest("GET", "/api/lookup/8.8.8.8", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result models.LookupResponse
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
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
}

func TestHandleLookup_MissingIP(t *testing.T) {
	mockService := &MockGeoService{}
	handler := NewLookupHandler(mockService)

	req := httptest.NewRequest("GET", "/api/lookup/", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var errResp models.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&errResp); err != nil {
		t.Fatalf("Failed to decode error response: %v", err)
	}

	if errResp.Code != "MISSING_IP" {
		t.Errorf("Expected error code 'MISSING_IP', got %s", errResp.Code)
	}
}

func TestHandleLookup_InvalidIP(t *testing.T) {
	mockService := &MockGeoService{
		ValidateIPFunc: func(ip string) error {
			return errors.New("Invalid IP address format")
		},
	}

	handler := NewLookupHandler(mockService)

	req := httptest.NewRequest("GET", "/api/lookup/invalid", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var errResp models.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&errResp); err != nil {
		t.Fatalf("Failed to decode error response: %v", err)
	}

	if errResp.Code != "INVALID_IP" {
		t.Errorf("Expected error code 'INVALID_IP', got %s", errResp.Code)
	}
}

func TestHandleLookup_LookupError(t *testing.T) {
	mockService := &MockGeoService{
		ValidateIPFunc: func(ip string) error {
			return nil
		},
		LookupFunc: func(ip string) (*models.LookupResponse, error) {
			return nil, errors.New("API unavailable")
		},
	}

	handler := NewLookupHandler(mockService)

	req := httptest.NewRequest("GET", "/api/lookup/8.8.8.8", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}

	var errResp models.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&errResp); err != nil {
		t.Fatalf("Failed to decode error response: %v", err)
	}

	if errResp.Code != "LOOKUP_FAILED" {
		t.Errorf("Expected error code 'LOOKUP_FAILED', got %s", errResp.Code)
	}
}

func TestHandleLookup_TrimWhitespace(t *testing.T) {
	var capturedIP string
	mockService := &MockGeoService{
		ValidateIPFunc: func(ip string) error {
			capturedIP = ip
			return nil
		},
		LookupFunc: func(ip string) (*models.LookupResponse, error) {
			return &models.LookupResponse{IP: ip}, nil
		},
	}

	handler := NewLookupHandler(mockService)

	// URL-encoded spaces: %20 = space
	req := httptest.NewRequest("GET", "/api/lookup/%208.8.8.8%20", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	// The handler trims whitespace from the extracted path segment
	if capturedIP != "8.8.8.8" {
		t.Errorf("Expected trimmed IP '8.8.8.8', got '%s'", capturedIP)
	}
}

func TestHandleLookup_IPv6(t *testing.T) {
	mockService := &MockGeoService{
		ValidateIPFunc: func(ip string) error {
			return nil
		},
		LookupFunc: func(ip string) (*models.LookupResponse, error) {
			return &models.LookupResponse{
				IP:          ip,
				Country:     "United States",
				CountryCode: "US",
				Timezone:    "UTC",
			}, nil
		},
	}

	handler := NewLookupHandler(mockService)

	// Note: IPv6 addresses with :: may be URL-encoded in practice
	req := httptest.NewRequest("GET", "/api/lookup/2001:db8::1", nil)
	w := httptest.NewRecorder()

	handler.HandleLookup(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var result models.LookupResponse
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if result.IP != "2001:db8::1" {
		t.Errorf("Expected IP '2001:db8::1', got %s", result.IP)
	}
}
