package handler

import (
	"errors"
	"net/http"
	"weblog/service"

	"database/sql"
	"strconv"
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

	req := CreatePostRequest{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "invalid request body",
			Code:  "BAD_REQUEST",
		})
	}

	post, err := h.postService.CreatePost(
		userID,
		req.Title,
		req.Content,
		"",
		req.Privacy,
	)

	if err != nil {
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
	posts, err := h.postService.GetVisiblePosts(userID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidUserID){
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: err.Error(),
				Code:  "INVALID_PRIVACY",
			})
		}
		
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "internal server error",
				Code:  "INTERNAL_ERROR",
		})
		
	}
	return c.JSON(http.StatusOK, posts)

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
	err = h.postService.DeletePost(postID, userID)
	if err != nil{
		 
	}

}