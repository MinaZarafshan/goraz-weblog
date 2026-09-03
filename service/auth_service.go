package service

import (
	"database/sql"
	"weblog/model"
	"weblog/repo"

	"golang.org/x/crypto/bcrypt"

	"errors"
)

var ErrUserNotFound = errors.New("user not found")
var ErrInvalidPassword = errors.New("invalid password")
var ErrUsernameExists = errors.New("username already exists")
var ErrEmptyUserOrPass = errors.New("username and password cannot be empty")

type AuthService struct {
	userRepo *repo.UserRepository
}

func NewAuthService(userRepo *repo.UserRepository) *AuthService {
	return &AuthService{
		userRepo: userRepo,
	}
}

func (s *AuthService) SignUp(username string, pass string) (model.User, error) {
	if username == "" || pass == "" {
		return model.User{}, ErrEmptyUserOrPass
	}
	_, err := s.userRepo.GetUserByUsername(username)

	if err == nil {
		return model.User{}, ErrUsernameExists
	}

	if !errors.Is(err, sql.ErrNoRows) {
		return model.User{}, err
	}
	hashPass, err := bcrypt.GenerateFromPassword(
		[]byte(pass),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return model.User{}, err
	}
	user := model.User{}
	user.Username = username
	user.PasswordHash = string(hashPass)

	return s.userRepo.CreateUser(user)
}
func (s *AuthService) Login(username string, pass string) (model.User, error) {
	if username == "" || pass == "" {
		return model.User{}, ErrEmptyUserOrPass
	}
	user, err := s.userRepo.GetUserByUsername(username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return model.User{}, ErrUserNotFound
		}
		return model.User{}, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(pass))
	if err != nil {
		return model.User{}, ErrInvalidPassword
	}
	return user, nil
}
func (s *AuthService) GetUserByID(userID int) (model.User, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return model.User{}, ErrUserNotFound
		}

		return model.User{}, err
	}

	return user, nil
}
