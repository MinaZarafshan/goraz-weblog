package handler

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"weblog/service"

	"github.com/labstack/echo/v5"
)

type PostHandler struct {
	postService *service.PostService
}
type CreatePostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Privacy string `json:"privacy"`
}

func NewPostHandler(postService *service.PostService) *PostHandler {
	return &PostHandler{
		postService: postService,
	}
}

func (h *PostHandler) CreatePost(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
	if !ok || userID <= 0 {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	title := c.FormValue("title")
	content := c.FormValue("content")
	privacy := c.FormValue("privacy")

	imagePath := ""
	savedFilePath := ""

	file, err := c.FormFile("image")

	if err != nil && !errors.Is(err, http.ErrMissingFile) {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid image upload",
			Code:  "INVALID_IMAGE_UPLOAD",
		})
	}

	if err == nil {
		imagePath, savedFilePath, err = saveUploadedImage(file)

		if err != nil {
			switch err {
			case ErrImageTooLarge:
				return c.JSON(http.StatusBadRequest, ErrorResponse{
					Error: err.Error(),
					Code:  "IMAGE_TOO_LARGE",
				})

			case ErrEmptyImage:
				return c.JSON(http.StatusBadRequest, ErrorResponse{
					Error: err.Error(),
					Code:  "EMPTY_IMAGE",
				})

			case ErrInvalidImageType:
				return c.JSON(http.StatusBadRequest, ErrorResponse{
					Error: err.Error(),
					Code:  "INVALID_IMAGE_TYPE",
				})

			case ErrImageOpen:
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: err.Error(),
					Code:  "IMAGE_OPEN_ERROR",
				})

			case ErrImageRead:
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: err.Error(),
					Code:  "IMAGE_READ_ERROR",
				})

			case ErrImageSeek:
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: err.Error(),
					Code:  "IMAGE_SEEK_ERROR",
				})

			default:
				return c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: "failed to save image",
					Code:  "IMAGE_SAVE_ERROR",
				})
			}
		}
	}

	post, err := h.postService.CreatePost(
		userID,
		title,
		content,
		imagePath,
		privacy,
	)

	if err != nil {
		if savedFilePath != "" {
			os.Remove(savedFilePath)
		}

		switch err {
		case service.ErrEmptyTitle:
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "EMPTY_TITLE",
			})

		case service.ErrEmptyContent:
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "EMPTY_CONTENT",
			})

		case service.ErrInvalidPrivacy:
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_PRIVACY",
			})

		default:
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "internal server error",
				Code:  "INTERNAL_ERROR",
			})
		}
	}

	return c.JSON(http.StatusCreated, post)
}
func (h *PostHandler) GetVisiblePosts(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
	if !ok || userID <= 0 {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	page := 1
	limit := 10

	pageStr := c.QueryParam("page")
	limitStr := c.QueryParam("limit")
	search := c.QueryParam("search")
	privacy := c.QueryParam("privacy")
	sort := c.QueryParam("sort")

	if pageStr != "" {
		value, err := strconv.Atoi(pageStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: "page must be a number",
				Code:  "INVALID_PAGE",
			})
		}

		page = value
	}

	if limitStr != "" {
		value, err := strconv.Atoi(limitStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: "limit must be a number",
				Code:  "INVALID_LIMIT",
			})
		}

		limit = value
	}

	result, err := h.postService.GetVisiblePosts(
		userID,
		page,
		limit,
		search,
		privacy,
		sort,
	)

	if err != nil {
		if errors.Is(err, service.ErrInvalidUserID) {
			return c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "unauthorized",
				Code:  "UNAUTHORIZED",
			})
		}

		if errors.Is(err, service.ErrInvalidPage) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_PAGE",
			})
		}

		if errors.Is(err, service.ErrInvalidLimit) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_LIMIT",
			})
		}

		if errors.Is(err, service.ErrInvalidPrivacyFilter) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_PRIVACY_FILTER",
			})
		}

		if errors.Is(err, service.ErrInvalidSort) {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_SORT",
			})
		}

		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	return c.JSON(http.StatusOK, result)
}
func (h *PostHandler) GetPostByID(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
	if !ok || userID <= 0 {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil || postID <= 0 {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid post id",
			Code:  "INVALID_POST_ID",
		})
	}

	post, err := h.postService.GetPostByID(postID, userID)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Error: "post not found",
				Code:  "POST_NOT_FOUND",
			})

		case errors.Is(err, service.ErrPostAccessDenied):
			return c.JSON(http.StatusForbidden, ErrorResponse{
				Error: "you do not have access to this post",
				Code:  "ACCESS_DENIED",
			})

		default:
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "internal server error",
				Code:  "INTERNAL_ERROR",
			})
		}
	}

	return c.JSON(http.StatusOK, post)
}

func (h *PostHandler) DeletePost(c *echo.Context) error {
	userID, ok := c.Get("user_id").(int)
	if !ok || userID <= 0 {
		return c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "unauthorized",
			Code:  "UNAUTHORIZED",
		})
	}

	postID, err := strconv.Atoi(c.Param("id"))
	if err != nil || postID <= 0 {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid post id",
			Code:  "INVALID_POST_ID",
		})
	}

	imagePath, err := h.postService.DeletePost(postID, userID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Error: "post not found",
				Code:  "POST_NOT_FOUND",
			})
		}

		if errors.Is(err, service.ErrInvalidUserID) {
			return c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "unauthorized",
				Code:  "UNAUTHORIZED",
			})
		}

		if errors.Is(err, service.ErrNotPostOwner) {
			return c.JSON(http.StatusForbidden, ErrorResponse{
				Error: "you are not allowed to delete this post",
				Code:  "NOT_POST_OWNER",
			})
		}

		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "internal server error",
			Code:  "INTERNAL_ERROR",
		})
	}

	if imagePath != "" {
		filePath := strings.TrimPrefix(imagePath, "/")

		err := os.Remove(filePath)

		if err != nil && !os.IsNotExist(err) {
			log.Printf("failed to delete post image: %v", err)
		}
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "post deleted successfully",
	})
}
