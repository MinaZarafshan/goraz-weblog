package service

import (
	"database/sql"
	"errors"
	"strings"
	"weblog/model"
	"weblog/repo"
)

var (
	ErrInvalidUserID        = errors.New("invalid user id")
	ErrEmptyTitle           = errors.New("title cannot be empty")
	ErrEmptyContent         = errors.New("content cannot be empty")
	ErrInvalidPrivacy       = errors.New("privacy must be public or private")
	ErrPostAccessDenied     = errors.New("you do not have access to this post")
	ErrNotPostOwner         = errors.New("only the post owner can delete this post")
	ErrInvalidPage          = errors.New("page must be greater than zero")
	ErrInvalidLimit         = errors.New("limit must be between 1 and 10")
	ErrInvalidPrivacyFilter = errors.New("privacy must be public or private")
	ErrInvalidSort          = errors.New("sort must be newest or oldest")
)

type PostService struct {
	postRepo *repo.PostRepository
	userRepo *repo.UserRepository
}
type PostListResult struct {
	Posts      []model.Post `json:"posts"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	Total      int          `json:"total"`
	TotalPages int          `json:"total_pages"`
}
type PostDetailResult struct {
	model.Post
	AuthorUsername string `json:"AuthorUsername"`
}

func NewPostService(
	postRepo *repo.PostRepository,
	userRepo *repo.UserRepository,
) *PostService {
	return &PostService{
		postRepo: postRepo,
		userRepo: userRepo,
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
) (PostDetailResult, error) {

	if postID <= 0 {
		return PostDetailResult{}, sql.ErrNoRows
	}

	if userID <= 0 {
		return PostDetailResult{}, ErrInvalidUserID
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return PostDetailResult{}, err
	}

	hasAccess := false

	if post.Privacy == "public" {
		hasAccess = true
	}

	if post.AuthorID == userID {
		hasAccess = true
	}

	if !hasAccess {
		shared, err := s.postRepo.IsPostSharedWithUser(
			postID,
			userID,
		)
		if err != nil {
			return PostDetailResult{}, err
		}

		if shared {
			hasAccess = true
		}
	}

	if !hasAccess {
		return PostDetailResult{}, ErrPostAccessDenied
	}

	author, err := s.userRepo.GetUserByID(post.AuthorID)
	if err != nil {
		return PostDetailResult{}, err
	}

	result := PostDetailResult{
		Post:           post,
		AuthorUsername: author.Username,
	}

	return result, nil
}

func (s *PostService) GetVisiblePosts(
	userID int,
	page int,
	limit int,
	search string,
	privacy string,
	sort string,
) (PostListResult, error) {

	if userID <= 0 {
		return PostListResult{}, ErrInvalidUserID
	}

	if page <= 0 {
		return PostListResult{}, ErrInvalidPage
	}

	if limit <= 0 || limit > 10 {
		return PostListResult{}, ErrInvalidLimit
	}

	search = strings.TrimSpace(search)
	privacy = strings.TrimSpace(privacy)
	sort = strings.TrimSpace(sort)

	if sort == "" {
		sort = "newest"
	}

	if sort != "newest" && sort != "oldest" {
		return PostListResult{}, ErrInvalidSort
	}

	if privacy != "" && privacy != "public" && privacy != "private" {
		return PostListResult{}, ErrInvalidPrivacyFilter
	}

	offset := (page - 1) * limit

	posts, err := s.postRepo.GetVisiblePosts(
		userID,
		limit,
		offset,
		search,
		privacy,
		sort,
	)
	if err != nil {
		return PostListResult{}, err
	}

	total, err := s.postRepo.CountVisiblePosts(
		userID,
		search,
		privacy,
	)
	if err != nil {
		return PostListResult{}, err
	}

	totalPages := (total + limit - 1) / limit

	result := PostListResult{
		Posts:      posts,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	return result, nil
}

func (s *PostService) DeletePost(
	postID int,
	userID int,
) (string, error) {

	if userID <= 0 {
		return "", ErrInvalidUserID
	}

	if postID <= 0 {
		return "", sql.ErrNoRows
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return "", err
	}

	if post.AuthorID != userID {
		return "", ErrNotPostOwner
	}

	err = s.postRepo.DeletePost(postID, userID)
	if err != nil {
		return "", err
	}

	return post.ImagePath, nil
}
