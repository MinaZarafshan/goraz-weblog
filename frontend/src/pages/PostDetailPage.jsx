import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function PostDetailPage() {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/posts/${id}/comments`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to load comments:',
          response.status
        )
        return
      }

      const data = await response.json()

      setComments(data)
    } catch (error) {
      console.error(
        'Could not load comments:',
        error
      )
    }
  }, [id])

  useEffect(() => {
    async function loadPost() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(
          `http://localhost:8080/posts/${id}`,
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found.')
          } else if (response.status === 403) {
            setError(
              'You do not have access to this post.'
            )
          } else {
            setError('Failed to load post.')
          }

          return
        }

        const data = await response.json()

        console.log('POST DETAIL:', data)

        setPost(data)
      } catch (error) {
        console.error(
          'Could not connect to backend:',
          error
        )

        setError(
          'Could not connect to the server.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadPost()
  }, [id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  async function handleAddComment() {
    if (commentText.trim() === '') {
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8080/posts/${id}/comments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: commentText,
          }),
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to create comment:',
          response.status
        )
        return
      }

      await response.json()

      setCommentText('')

      await loadComments()
    } catch (error) {
      console.error(
        'Could not create comment:',
        error
      )
    }
  }

  if (isLoading) {
    return (
      <p>
        Loading post...
      </p>
    )
  }

  if (error) {
    return (
      <p>
        {error}
      </p>
    )
  }

  return (
    <main>
      {post && (
        <div>
          <h1>{post.Title}</h1>

          <p>
            Author: {post.AuthorUsername}
          </p>

          <p>
            Privacy: {post.Privacy}
          </p>

          <p>
            {post.Content}
          </p>

          {post.ImagePath && (
            <img
              src={`http://localhost:8080${post.ImagePath}`}
              alt={post.Title}
              width="500"
            />
          )}

          <section>
            <h2>Comments</h2>

            {comments.length === 0 && (
              <p>
                No comments yet.
              </p>
            )}

            {comments.map((comment) => {
              return (
                <div key={comment.id}>
                  <strong>
                    {comment.username}
                  </strong>

                  <p>
                    {comment.text}
                  </p>
                </div>
              )
            })}

            <div>
              <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value
                  )
                }
              />

              <button
                onClick={handleAddComment}
              >
                Post Comment
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default PostDetailPage