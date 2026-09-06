package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"

	"weblog/service"
)

type CommentHandler struct {
	service *service.CommentService
}

type createCommentRequest struct {
	Text string `json:"text"`
}

func NewCommentHandler(service *service.CommentService) *CommentHandler {
	return &CommentHandler{
		service: service,
	}
}

func (h *CommentHandler) CreateComment(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
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

	var req createCommentRequest

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "INVALID_BODY",
		})
	}

	comment, err := h.service.CreateComment(
		postID,
		userID,
		req.Text,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "POST_NOT_FOUND",
			})

		case errors.Is(err, service.ErrPostAccessDenied):
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "POST_ACCESS_DENIED",
			})

		case errors.Is(err, service.ErrEmptyComment):
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "EMPTY_COMMENT",
			})

		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "INTERNAL_SERVER_ERROR",
			})
		}
	}

	return c.JSON(http.StatusCreated, comment)
}

func (h *CommentHandler) GetCommentsByPostID(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
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

	comments, err := h.service.GetCommentsByPostID(
		postID,
		userID,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "POST_NOT_FOUND",
			})

		case errors.Is(err, service.ErrPostAccessDenied):
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "POST_ACCESS_DENIED",
			})

		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "INTERNAL_SERVER_ERROR",
			})
		}
	}

	return c.JSON(http.StatusOK, comments)
}