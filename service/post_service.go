package service

import (
	"database/sql"
	"errors"
	"strings"
	"weblog/model"
	"weblog/repo"
)

var (
	ErrInvalidUserID    = errors.New("invalid user id")
	ErrEmptyTitle       = errors.New("title cannot be empty")
	ErrEmptyContent     = errors.New("content cannot be empty")
	ErrInvalidPrivacy   = errors.New("privacy must be public or private")
	ErrPostAccessDenied = errors.New("you do not have access to this post")
	ErrNotPostOwner = errors.New("only the post owner can delete this post")
)

type PostService struct {
	postRepo *repo.PostRepository
}
func NewPostService(postRepo *repo.PostRepository) *PostService {
	return &PostService{
		postRepo: postRepo,
	}
}

func (s *PostService) CreatePost(
	userID int,
	title string,
	content string,
	imagePath string,
	privacy string,
) (model.Post, error) {

	if userID <= 0 {
		return model.Post{}, ErrInvalidUserID
	}

	if strings.TrimSpace(title) == "" {
		return model.Post{}, ErrEmptyTitle
	}

	if strings.TrimSpace(content) == "" {
		return model.Post{}, ErrEmptyContent
	}

	if privacy != "public" && privacy != "private" {
		return model.Post{}, ErrInvalidPrivacy
	}

	post := model.Post{
		Title:     title,
		Content:   content,
		ImagePath: imagePath,
		AuthorID:  userID,
		Privacy:   privacy,
	}

	createdPost, err := s.postRepo.CreatePost(post)
	if err != nil {
		return model.Post{}, err
	}

	return createdPost, nil
}

func (s *PostService) GetPostByID(
	postID int,
	userID int,
) (model.Post, error) {

	if postID <= 0 {
		return model.Post{}, sql.ErrNoRows
	}

	if userID <= 0 {
		return model.Post{}, ErrInvalidUserID
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return model.Post{}, err
	}

	if post.Privacy == "public" {
		return post, nil
	}

	if post.AuthorID == userID {
		return post, nil
	}

	shared, err := s.postRepo.IsPostSharedWithUser(postID, userID)
	if err != nil {
		return model.Post{}, err
	}

	if shared {
		return post, nil
	}

	return model.Post{}, ErrPostAccessDenied
}

func (s *PostService) GetVisiblePosts(userID int) ([]model.Post, error) {
	if userID <= 0 {
		return []model.Post{}, ErrInvalidUserID
	}

	posts, err := s.postRepo.GetVisiblePosts(userID)
	if err != nil {
		return []model.Post{}, err
	}

	return posts, nil
}

func (s *PostService) DeletePost(postID int, userID int) error {
	if postID <= 0 {
		return sql.ErrNoRows
	}

	if userID <= 0 {
		return ErrInvalidUserID
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return err
	}

	if post.AuthorID != userID {
		return ErrNotPostOwner
	}

	err = s.postRepo.DeletePost(postID, userID)
	if err != nil {
		return err
	}

	return nil
}