import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  const [sharedUsers, setSharedUsers] = useState([])
  const [shareUsername, setShareUsername] = useState('')
  const [shareError, setShareError] = useState('')

  const [currentUser, setCurrentUser] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwner =
    currentUser &&
    post &&
    currentUser.id === post.AuthorID

  const canManageSharing =
    isOwner &&
    post.Privacy === 'private'

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

  const loadSharedUsers = useCallback(async () => {
    if (!canManageSharing) {
      setSharedUsers([])
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to load shared users:',
          response.status
        )
        return
      }

      const data = await response.json()

      console.log(
        'SHARED USERS:',
        data
      )

      setSharedUsers(data)
    } catch (error) {
      console.error(
        'Could not load shared users:',
        error
      )
    }
  }, [id, canManageSharing])

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
            setError(
              'Post not found.'
            )
          } else if (response.status === 403) {
            setError(
              'You do not have access to this post.'
            )
          } else {
            setError(
              'Failed to load post.'
            )
          }

          return
        }

        const data = await response.json()

        console.log(
          'POST DETAIL:',
          data
        )

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

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch(
          'http://localhost:8080/auth/me',
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          console.error(
            'Failed to load current user:',
            response.status
          )
          return
        }

        const data = await response.json()

        console.log(
          'CURRENT USER:',
          data
        )

        setCurrentUser(data)
      } catch (error) {
        console.error(
          'Could not load current user:',
          error
        )
      }
    }

    loadCurrentUser()
  }, [])

  useEffect(() => {
    loadSharedUsers()
  }, [loadSharedUsers])

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

  async function handleSharePost() {
    if (shareUsername.trim() === '') {
      setShareError(
        'Username cannot be empty.'
      )
      return
    }

    try {
      setShareError('')

      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: shareUsername,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()

        if (
          data.error === 'USER_NOT_FOUND'
        ) {
          setShareError(
            'User not found.'
          )
        } else if (
          data.error ===
          'CANNOT_SHARE_WITH_SELF'
        ) {
          setShareError(
            'You cannot share a post with yourself.'
          )
        } else if (
          data.error === 'ALREADY_SHARED'
        ) {
          setShareError(
            'This post is already shared with that user.'
          )
        } else if (
          data.error === 'POST_NOT_PRIVATE'
        ) {
          setShareError(
            'Only private posts can be shared.'
          )
        } else if (
          data.error === 'NOT_POST_OWNER'
        ) {
          setShareError(
            'Only the post owner can share this post.'
          )
        } else {
          setShareError(
            'Failed to share post.'
          )
        }

        return
      }

      setShareUsername('')

      await loadSharedUsers()
    } catch (error) {
      console.error(
        'Could not share post:',
        error
      )

      setShareError(
        'Could not connect to the server.'
      )
    }
  }

  async function handleUnsharePost(userID) {
    try {
      setShareError('')

      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares/${userID}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const data = await response.json()

        if (
          data.error === 'SHARE_NOT_FOUND'
        ) {
          setShareError(
            'This user no longer has access.'
          )
        } else if (
          data.error === 'NOT_POST_OWNER'
        ) {
          setShareError(
            'Only the post owner can remove access.'
          )
        } else if (
          data.error === 'POST_NOT_PRIVATE'
        ) {
          setShareError(
            'Only private posts can be shared.'
          )
        } else {
          setShareError(
            'Failed to remove access.'
          )
        }

        return
      }

      await loadSharedUsers()
    } catch (error) {
      console.error(
        'Could not remove shared user:',
        error
      )

      setShareError(
        'Could not connect to the server.'
      )
    }
  }

  async function handleDeletePost() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8080/posts/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to delete post:',
          response.status
        )
        return
      }

      navigate('/home')
    } catch (error) {
      console.error(
        'Could not delete post:',
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
          <h1>
            {post.Title}
          </h1>

          <p>
            Author:{' '}
            {post.AuthorUsername}
          </p>

          <p>
            Privacy:{' '}
            {post.Privacy}
          </p>

          {isOwner && (
            <button
              onClick={handleDeletePost}
            >
              Delete Post
            </button>
          )}

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

          {canManageSharing && (
            <section>
              <h2>
                Sharing
              </h2>

              <p>
                Shared users:{' '}
                {sharedUsers.length}
              </p>

              {sharedUsers.length === 0 && (
                <p>
                  This post has not been shared with anyone yet.
                </p>
              )}

              {sharedUsers.map((user) => {
                return (
                  <div key={user.id}>
                    <span>
                      {user.username}
                    </span>

                    <button
                      onClick={() =>
                        handleUnsharePost(
                          user.id
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                )
              })}

              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={shareUsername}
                  onChange={(event) => {
                    setShareUsername(
                      event.target.value
                    )

                    setShareError('')
                  }}
                />

                <button
                  onClick={handleSharePost}
                >
                  Share
                </button>
              </div>

              {shareError && (
                <p>
                  {shareError}
                </p>
              )}
            </section>
          )}

          <section>
            <h2>
              Comments
            </h2>

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