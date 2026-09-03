package middleware

import (
	"net/http"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v5"
)

func AuthMiddleware(store *sessions.CookieStore) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {

			session, err := store.Get(c.Request(), "auth-session")
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "unauthorized",
					"code":  "UNAUTHORIZED",
				})
			}

			userID, ok := session.Values["user_id"].(int)
			if !ok || userID <= 0 {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "unauthorized",
					"code":  "UNAUTHORIZED",
				})
			}

			c.Set("user_id", userID)

			return next(c)
		}
	}
}
