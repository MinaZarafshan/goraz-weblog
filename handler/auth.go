package handler

import (
	"errors"
	"net/http"

	// "weblog/model"
	"weblog/service"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v5"
)

type AuthHandler struct {
	authService *service.AuthService
	store       *sessions.CookieStore
}
type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ErrorResponse struct {
	Error string `json:"error"`
	Code  string `json:"code,omitempty"`
}

type UserResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

func NewAuthHandler(s *service.AuthService, store *sessions.CookieStore) *AuthHandler {
	return &AuthHandler{
		authService: s,
		store:       store,
	}
}

func (h *AuthHandler) SignUp(c *echo.Context) error {
	var req AuthRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid request",
			Code:  "BAD_REQUEST",
		})
	}

	user, err := h.authService.SignUp(req.Username, req.Password)
	if err != nil {

		if errors.Is(err, service.ErrEmptyUserOrPass) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: "username and password cannot be empty",
				Code:  "EMPTY_CREDENTIALS",
			})
		}

		if errors.Is(err, service.ErrUsernameExists) {
			return c.JSON(http.StatusConflict, ErrorResponse{
				Error: "username already exists",
				Code:  "USERNAME_EXISTS",
			})
		}

		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	session, err := h.store.Get(c.Request(), "auth-session")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	session.Values["user_id"] = user.ID

	if err := session.Save(c.Request(), c.Response()); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	return c.JSON(http.StatusCreated, UserResponse{
		ID:       user.ID,
		Username: user.Username,
	})
}

func (h *AuthHandler) Login(c *echo.Context) error {
	var req AuthRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid request",
			Code:  "BAD_REQUEST",
		})
	}
	user, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) ||
			errors.Is(err, service.ErrInvalidPassword) {

			return c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "invalid username or password",
				Code:  "INVALID_CREDENTIALS",
			})
		}
		if errors.Is(err, service.ErrEmptyUserOrPass) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: "username and password cannot be empty",
				Code:  "EMPTY_CREDENTIALS",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Internal Server Error",
			Code:  "INTERNAL_ERROR",
		})
	}
	session, err := h.store.Get(c.Request(), "auth-session")

	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}
	session.Values["user_id"] = user.ID
	if err := session.Save(c.Request(), c.Response()); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}
	return c.JSON(http.StatusOK, UserResponse{
		ID:       user.ID,
		Username: user.Username,
	})
}

func (h *AuthHandler) Logout(c *echo.Context) error {
	session, err := h.store.Get(c.Request(), "auth-session")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}
	session.Options.MaxAge = -1
	if err := session.Save(c.Request(), c.Response()); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}
	return c.JSON(http.StatusOK, map[string]string{
		"message": "logout successful",
	})
}

func (h *AuthHandler) Me(c *echo.Context) error {
	session, err := h.store.Get(c.Request(), "auth-session")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	value, exists := session.Values["user_id"]
	if !exists {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	userID, ok := value.(int)
	if !ok || userID <= 0 {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "unauthorized",
				Code:  "UNAUTHORIZED",
			})
		}

		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	return c.JSON(http.StatusOK, UserResponse{
		ID:       user.ID,
		Username: user.Username,
	})

}
