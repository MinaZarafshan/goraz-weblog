package main

import (
	"os"
	"weblog/handler"
	"weblog/repo"
	"weblog/service"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	_ "github.com/lib/pq"

	"database/sql"
	"fmt"
	"log"
	"net/http"
	"weblog/middleware"

	"github.com/gorilla/sessions"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("error loading .env file")
	}

	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")
	port := os.Getenv("POSTGRES_PORT")

	connStr := fmt.Sprintf(
		"host=localhost port=%s user=%s password=%s dbname=%s sslmode=disable",
		port,
		user,
		password,
		dbName,
	)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET is not set")
	}
	store := sessions.NewCookieStore([]byte(sessionSecret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	}
	userRepo := repo.NewUserRepository(db)
	userService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(userService, store)
	postRepo := repo.NewPostRepository(db)
	postService := service.NewPostService(postRepo)
	postHandler := handler.NewPostHandler(postService)
	postShareRepo := repo.NewPostShareRepo(db)
	postShareService := service.NewPostShareService(userRepo, postRepo, postShareRepo)
	postShareHandler := handler.NewPostShareHandler(postShareService)
	commentRepo := repo.NewCommentRepo(db)
	commentService := service.NewCommentService(commentRepo,postService)
	commentHandler := handler.NewCommentHandler(commentService)
	e := echo.New()
	e.POST("/auth/login", authHandler.Login)
	e.POST("/auth/signup", authHandler.SignUp)
	e.GET("/auth/me", authHandler.Me)
	e.POST("/auth/logout", authHandler.Logout)
	e.POST("/posts", postHandler.CreatePost, middleware.AuthMiddleware(store))
	e.GET("/posts", postHandler.GetVisiblePosts, middleware.AuthMiddleware(store))
	e.GET("/posts/:id", postHandler.GetPostByID, middleware.AuthMiddleware(store))
	e.DELETE("/posts/:id", postHandler.DeletePost, middleware.AuthMiddleware(store))
	e.POST("/posts/:id/shares", postShareHandler.SharePost, middleware.AuthMiddleware(store))
	e.GET("/posts/:id/shares", postShareHandler.GetSharedUsers, middleware.AuthMiddleware(store))
	e.DELETE("/posts/:id/shares/:userID", postShareHandler.UnsharePost, middleware.AuthMiddleware(store))
	e.POST("/posts/:id/comments", commentHandler.CreateComment, middleware.AuthMiddleware(store))
	e.GET("/posts/:id/comments", commentHandler.GetCommentsByPostID, middleware.AuthMiddleware(store))
	if err := e.Start(":8080"); err != nil {
		e.Logger.Error("server stopped", "error", err)
	}
}
