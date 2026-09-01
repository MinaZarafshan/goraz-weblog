package handler

import(
		"net/http"
	"notes/project/service"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v5"
)
type AuthHandler struct{
	authService *service.AuthService
	store       *sessions.CookieStore
}

func NewAuthHandler(s *service.AuthService, store *sessions.CookieStore) *AuthHandler{
	return &AuthHandler{
		authService: s,
		store: store,
	}
}

