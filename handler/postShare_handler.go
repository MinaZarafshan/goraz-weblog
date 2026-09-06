package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"weblog/service"
)

type PostShareHandler struct {
	service *service.PostShareService
}
type sharePostRequest struct {
	Username string `json:"username"`
}

func NewPostShareHandler(service *service.PostShareService) *PostShareHandler {
	return &PostShareHandler{
		service: service,
	}
}

func (h *PostShareHandler) SharePost(c *echo.Context) error {
	currentUserID, ok := c.Get("user_id").(int)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "UNAUTHORIZED",
		})
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_POST_ID",
		})
	}

	var req sharePostRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_BODY",
		})
	}

	err = h.service.SharePost(
		currentUserID,
		postID,
		req.Username,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "POST_NOT_FOUND",
			})

		case errors.Is(err, service.ErrNotPostOwner):
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "NOT_POST_OWNER",
			})

		case errors.Is(err, service.ErrPostNotPrivate):
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "POST_NOT_PRIVATE",
			})

		case errors.Is(err, service.ErrEmptyUsername):
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "EMPTY_USERNAME",
			})

		case errors.Is(err, service.ErrShareUserNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "USER_NOT_FOUND",
			})

		case errors.Is(err, service.ErrCannotShareWithSelf):
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "CANNOT_SHARE_WITH_SELF",
			})

		case errors.Is(err, service.ErrAlreadyShared):
			return c.JSON(http.StatusConflict, map[string]string{
				"error": "ALREADY_SHARED",
			})

		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "INTERNAL_SERVER_ERROR",
			})
		}
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"message": "post shared successfully",
	})
}
func (h *PostShareHandler) GetSharedUsers(c *echo.Context) error {
	currentUserID, ok := c.Get("user_id").(int)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "UNAUTHORIZED",
		})
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_POST_ID",
		})
	}

	users, err := h.service.GetSharedUsers(currentUserID, postID)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "POST_NOT_FOUND",
			})

		case errors.Is(err, service.ErrNotPostOwner):
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "NOT_POST_OWNER",
			})

		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "INTERNAL_SERVER_ERROR",
			})
		}
	}

	return c.JSON(http.StatusOK, users)
}

func (h *PostShareHandler) UnsharePost(c *echo.Context) error {
	currentUserID, ok := c.Get("user_id").(int)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "UNAUTHORIZED",
		})
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_POST_ID",
		})
	}

	targetUserID, err := strconv.Atoi(c.Param("userID"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_USER_ID",
		})
	}

	err = h.service.UnsharePost(
		currentUserID,
		postID,
		targetUserID,
	)

	if err != nil {
		switch {
		case errors.Is(err, service.ErrNotPostOwner):
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "NOT_POST_OWNER",
			})

		case errors.Is(err, service.ErrPostNotPrivate):
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "POST_NOT_PRIVATE",
			})

		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "SHARE_NOT_FOUND",
			})

		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "INTERNAL_SERVER_ERROR",
			})
		}
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "post unshared successfully",
	})
}
