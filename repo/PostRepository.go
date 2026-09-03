package repo
import ("weblog/model"
		"database/sql")

type PostRepository struct{
	db * sql.DB
}

func NewPostRepository(db * sql.DB) *PostRepository{
	return &PostRepository{
		db: db,
	}
}

func (r *PostRepository)CreatePost(p model.Post)(model.Post, error){
	row := r.db.QueryRow("INSERT INTO posts(title, content, image_path, author_id, privacy) VALUES($1, $2, $3, $4, $5) RETURNING title, id, content, image_path, author_id, privacy, created_at", p.Title, p.Content, p.ImagePath, p.AuthorID, p.Privacy)
	post := model.Post{}
	err := row.Scan(&post.Title, &post.ID, &post.Content, &post.ImagePath, &post.AuthorID, &post.Privacy, &post.CreatedAt)
	if err != nil{
		return  model.Post{}, err
	}
	return post, nil
}

func (r *PostRepository) GetPostByID(PostID int)(model.Post, error){
	row := r.db.QueryRow("SELECT title, id, content, image_path, author_id, privacy, created_at FROM posts WHERE id = $1", PostID)
	post := model.Post{}
	err := row.Scan(&post.Title, &post.ID, &post.Content, &post.ImagePath, &post.AuthorID, &post.Privacy, &post.CreatedAt)
	if err != nil{
		return  model.Post{}, err
	}
	return post, nil
}
func (r *PostRepository)GetVisiblePosts(userID int)([]model.Post, error){
	rows, err := r.db.Query("SELECT id,title,content, image_path,author_id,privacy, created_at FROM posts WHERE privacy = 'public' OR author_id = $1 OR EXISTS ( SELECT 1 FROM post_shares WHERE post_shares.post_id = posts.id AND post_shares.user_id = $1 ) ORDER BY created_at DESC;", userID)
	if err != nil {
		return []model.Post{}, err
	}
	defer rows.Close()
	posts := []model.Post{}
	for rows.Next() {
		post := model.Post{}

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.Content,
			&post.ImagePath,
			&post.AuthorID,
			&post.Privacy,
			&post.CreatedAt,
		)
		if err != nil {
			return []model.Post{}, err
		}

		posts = append(posts, post)
	}
	if rows.Err() != nil {
		return []model.Post{}, rows.Err()
	}
	return posts, nil
}

func (r *PostRepository)DeletePost(PostID int, UserID int)error{
	res, err := r.db.Exec("DELETE FROM posts WHERE id=$1 AND author_id=$2", PostID, UserID)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()

	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
func (r *PostRepository) IsPostSharedWithUser(postID int, userID int) (bool, error) {
	var exists bool

	err := r.db.QueryRow(`
		SELECT EXISTS (
			SELECT 1
			FROM post_shares
			WHERE post_id = $1 AND user_id = $2
		)
	`, postID, userID).Scan(&exists)

	if err != nil {
		return false, err
	}

	return exists, nil
}