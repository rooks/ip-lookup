package models

// IPLocateResponse represents the response from iplocate.io API
type IPLocateResponse struct {
	IP          string `json:"ip"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	Timezone    string `json:"time_zone"`
	City        string `json:"city,omitempty"`
	Error       string `json:"error,omitempty"`
}

// LookupResponse is the API response we send to clients
type LookupResponse struct {
	IP          string `json:"ip"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	City        string `json:"city"`
	Timezone    string `json:"timezone"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}
