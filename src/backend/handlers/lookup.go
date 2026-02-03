package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"ip-lookup/models"
	"ip-lookup/services"
)

// LookupHandler handles IP lookup requests
type LookupHandler struct {
	geoService *services.GeoService
}

func NewLookupHandler(geoService *services.GeoService) *LookupHandler {
	return &LookupHandler{
		geoService: geoService,
	}
}

// GET /api/lookup/:ip
func (h *LookupHandler) HandleLookup(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Extract IP from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/lookup/")
	ip := strings.TrimSpace(path)

	if ip == "" {
		h.writeError(w, http.StatusBadRequest, "MISSING_IP", "IP address is required")
		return
	}

	// Validate IP format
	if err := h.geoService.ValidateIP(ip); err != nil {
		h.writeError(w, http.StatusBadRequest, "INVALID_IP", err.Error())
		return
	}

	// Perform lookup
	result, err := h.geoService.Lookup(ip)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "LOOKUP_FAILED", err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (h *LookupHandler) writeError(w http.ResponseWriter, status int, code, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{
		Error:   message,
		Code:    code,
		Message: message,
	})
}
