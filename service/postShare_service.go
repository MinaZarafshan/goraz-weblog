package service

import (
	"database/sql"
	"errors"
	"strings"
	"weblog/repo"
)

var (
	ErrPostNotPrivate      = errors.New("only private posts can be shared")
	ErrShareUserNotFound   = errors.New("user to share with was not found")
	ErrCannotShareWithSelf = errors.New("you cannot share a post with yourself")
	ErrAlreadyShared       = errors.New("post is already shared with this user")
	ErrEmptyUsername       = errors.New("username cannot be empty")
)

type PostShareService struct {
	userRepo      *repo.UserRepository
	postRepo      *repo.PostRepository
	postShareRepo *repo.PostShareRepo
}

func NewPostShareService(userRepo *repo.UserRepository,
	postRepo *repo.PostRepository,
	postShareRepo *repo.PostShareRepo) *PostShareService {

	return &PostShareService{
		userRepo:      userRepo,
		postRepo:      postRepo,
		postShareRepo: postShareRepo,
	}

}

func (s *PostShareService) SharePost(
	currentUserID int,
	postID int,
	targetUsername string,
) error {

	if currentUserID <= 0 {
		return ErrInvalidUserID
	}

	if postID <= 0 {
		return sql.ErrNoRows
	}

	targetUsername = strings.TrimSpace(targetUsername)
	if targetUsername == "" {
		return ErrEmptyUsername
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return err
	}

	if post.AuthorID != currentUserID {
		return ErrNotPostOwner
	}

	if post.Privacy != "private" {
		return ErrPostNotPrivate
	}

	targetUser, err := s.userRepo.GetUserByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrShareUserNotFound
		}

		return err
	}

	if targetUser.ID == currentUserID {
		return ErrCannotShareWithSelf
	}

	shared, err := s.postRepo.IsPostSharedWithUser(
		postID,
		targetUser.ID,
	)
	if err != nil {
		return err
	}

	if shared {
		return ErrAlreadyShared
	}

	err = s.postShareRepo.SharePost(
		targetUser.ID,
		postID,
	)
	if err != nil {
		return err
	}

	return nil
}


func (s *PostShareService) GetSharedUsers(
	currentUserID int,
	postID int,
) ([]repo.SharedUser, error) {

	if currentUserID <= 0 {
		return nil, ErrInvalidUserID
	}

	if postID <= 0 {
		return nil, sql.ErrNoRows
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return nil, err
	}

	if post.AuthorID != currentUserID {
		return nil, ErrNotPostOwner
	}

	users, err := s.postShareRepo.GetSharedUsers(postID)
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *PostShareService) UnsharePost(
	currentUserID int,
	postID int,
	targetUserID int,
) error {

	if currentUserID <= 0 {
		return ErrInvalidUserID
	}

	if postID <= 0 {
		return sql.ErrNoRows
	}

	if targetUserID <= 0 {
		return sql.ErrNoRows
	}

	post, err := s.postRepo.GetPostByID(postID)
	if err != nil {
		return err
	}

	if post.AuthorID != currentUserID {
		return ErrNotPostOwner
	}

	if post.Privacy != "private" {
		return ErrPostNotPrivate
	}

	err = s.postShareRepo.UnsharePost(postID, targetUserID)
	if err != nil {
		return err
	}

	return nil
}