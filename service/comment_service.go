package service

import (
	"database/sql"
	"errors"
	"strings"

	"weblog/model"
	"weblog/repo"
)

var ErrEmptyComment = errors.New("comment cannot be empty")

type CommentService struct {
	commentRepo *repo.CommentRepo
	postService *PostService
}

func NewCommentService(
	commentRepo *repo.CommentRepo,
	postService *PostService,
) *CommentService {

	return &CommentService{
		commentRepo: commentRepo,
		postService: postService,
	}
}

func (s *CommentService) CreateComment(
	postID int,
	userID int,
	text string,
) (model.Comment, error) {

	if userID <= 0 {
		return model.Comment{}, ErrInvalidUserID
	}

	if postID <= 0 {
		return model.Comment{}, sql.ErrNoRows
	}

	text = strings.TrimSpace(text)

	if text == "" {
		return model.Comment{}, ErrEmptyComment
	}

	_, err := s.postService.GetPostByID(postID, userID)
	if err != nil {
		return model.Comment{}, err
	}

	comment, err := s.commentRepo.CreateComment(
		postID,
		userID,
		text,
	)
	if err != nil {
		return model.Comment{}, err
	}

	return comment, nil
}
func (s *CommentService) GetCommentsByPostID(
	postID int,
	userID int,
) ([]repo.CommentWithAuthor, error) {

	if userID <= 0 {
		return nil, ErrInvalidUserID
	}

	if postID <= 0 {
		return nil, sql.ErrNoRows
	}

	_, err := s.postService.GetPostByID(postID, userID)
	if err != nil {
		return nil, err
	}

	comments, err := s.commentRepo.GetCommentsByPostID(postID)
	if err != nil {
		return nil, err
	}

	return comments, nil
}
