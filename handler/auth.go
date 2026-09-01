package handler

import(
	"github.com/gorilla/sessions"
	"weblog/service")


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

