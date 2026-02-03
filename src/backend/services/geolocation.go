package services

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"ip-lookup/models"

	"github.com/hashicorp/golang-lru/v2/expirable"
)

const (
	ipLocateBaseURL = "https://www.iplocate.io/api/lookup"
	requestTimeout  = 10 * time.Second
)

// GeoService handles IP geolocation lookups
type GeoService struct {
	cache  *expirable.LRU[string, *models.LookupResponse]
	client *http.Client
}

// NewGeoService creates a new GeoService instance
func NewGeoService(c *expirable.LRU[string, *models.LookupResponse]) *GeoService {
	return &GeoService{
		cache: c,
		client: &http.Client{
			Timeout: requestTimeout,
		},
	}
}

// ValidateIP checks if the given string is a valid IP address
func (s *GeoService) ValidateIP(ip string) error {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return fmt.Errorf("Invalid IP address format")
	}

	return nil
}

// Lookup returns geolocation data for the given IP address
func (s *GeoService) Lookup(ip string) (*models.LookupResponse, error) {
	if cached, found := s.cache.Get(ip); found {
		return cached, nil
	}

	// Make API request
	url := fmt.Sprintf("%s/%s", ipLocateBaseURL, ip)
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch geolocation data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var ipLocateResp models.IPLocateResponse
	if err := json.NewDecoder(resp.Body).Decode(&ipLocateResp); err != nil {
		return nil, fmt.Errorf("failed to decode API response: %w", err)
	}

	if ipLocateResp.Error != "" {
		return nil, fmt.Errorf("API error: %s", ipLocateResp.Error)
	}

	result := &models.LookupResponse{
		IP:          ipLocateResp.IP,
		Country:     ipLocateResp.Country,
		CountryCode: ipLocateResp.CountryCode,
		City:        ipLocateResp.City,
		Timezone:    ipLocateResp.Timezone,
	}

	// Cache the result
	s.cache.Add(ip, result)

	return result, nil
}
