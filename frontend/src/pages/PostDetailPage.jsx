import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

function readApiError(data) {
  const rawError =
    data?.error ||
    data?.Error ||
    ''

  const explicitCode =
    data?.code ||
    data?.Code ||
    ''

  const errorLooksLikeCode =
    typeof rawError === 'string' &&
    /^[A-Z0-9_]+$/.test(rawError)

  return {
    code:
      explicitCode ||
      (errorLooksLikeCode
        ? rawError
        : ''),
    message:
      explicitCode
        ? rawError
        : errorLooksLikeCode
          ? ''
          : rawError,
  }
}

async function readErrorResponse(response) {
  try {
    const data = await response.json()
    return readApiError(data)
  } catch {
    return {
      code: '',
      message: '',
    }
  }
}

function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentsLoadError, setCommentsLoadError] =
    useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] =
    useState(false)

  const [sharedUsers, setSharedUsers] = useState([])
  const [shareUsername, setShareUsername] = useState('')
  const [shareError, setShareError] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [removingUserID, setRemovingUserID] =
    useState(null)

  const [currentUser, setCurrentUser] = useState(null)

  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [logoutError, setLogoutError] = useState('')
  const [isLogoutModalOpen, setIsLogoutModalOpen] =
    useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [unshareTarget, setUnshareTarget] = useState(null)

  const [isCommentsModalOpen, setIsCommentsModalOpen] =
    useState(false)
  const [commentsTab, setCommentsTab] = useState('comments')

  const [isShareModalOpen, setIsShareModalOpen] =
    useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const numericPostID = Number(id)

  const isValidPostID =
    Number.isInteger(numericPostID) &&
    numericPostID > 0

  const isOwner =
    currentUser &&
    post &&
    currentUser.id === post.AuthorID

  const canManageSharing =
    isOwner &&
    post?.Privacy === 'private'

  const loadComments = useCallback(async () => {
    if (!isValidPostID) {
      setComments([])
      setCommentsLoadError(
        'Invalid post ID.'
      )
      return
    }

    try {
      setCommentsLoadError('')

      const response = await fetch(
        `http://localhost:8080/posts/${id}/comments`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (code === 'UNAUTHORIZED') {
          setCommentsLoadError(
            'Your session has expired. Please log in again.'
          )
        } else if (
          code === 'INVALID_POST_ID'
        ) {
          setCommentsLoadError(
            'Invalid post ID.'
          )
        } else if (
          code === 'POST_NOT_FOUND'
        ) {
          setCommentsLoadError(
            'Post not found.'
          )
        } else if (
          code === 'POST_ACCESS_DENIED'
        ) {
          setCommentsLoadError(
            'You do not have access to these comments.'
          )
        } else if (
          code === 'INTERNAL_SERVER_ERROR'
        ) {
          setCommentsLoadError(
            'The server could not load comments.'
          )
        } else {
          setCommentsLoadError(
            message ||
              'Failed to load comments.'
          )
        }

        return
      }

      const data = await response.json()

      setComments(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      console.error(
        'Could not load comments:',
        error
      )

      setCommentsLoadError(
        'Could not connect to the server.'
      )
    }
  }, [id, isValidPostID])

  const loadSharedUsers = useCallback(async () => {
    if (!isValidPostID) {
      setSharedUsers([])
      return
    }

    if (!canManageSharing) {
      setSharedUsers([])
      return
    }

    try {
      setShareError('')

      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (
          code === 'POST_NOT_FOUND' ||
          response.status === 404
        ) {
          setShareError(
            'Post not found.'
          )
        } else if (
          code === 'NOT_POST_OWNER' ||
          response.status === 403
        ) {
          setShareError(
            'Only the post owner can manage sharing.'
          )
        } else if (
          code === 'UNAUTHORIZED' ||
          response.status === 401
        ) {
          setShareError(
            'Your session has expired. Please log in again.'
          )
        } else if (
          code === 'POST_NOT_PRIVATE'
        ) {
          setShareError(
            'Only private posts can be shared.'
          )
        } else {
          setShareError(
            message ||
              'Failed to load shared users.'
          )
        }

        return
      }

      const data = await response.json()

      setSharedUsers(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      console.error(
        'Could not load shared users:',
        error
      )

      setShareError(
        'Could not connect to the server.'
      )
    }
  }, [
    id,
    isValidPostID,
    canManageSharing,
  ])

  useEffect(() => {
    async function loadPost() {
      if (!isValidPostID) {
        setError(
          'Invalid post ID.'
        )
        setIsLoading(false)
        return
      }

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
          const { message } =
            await readErrorResponse(response)

          if (response.status === 400) {
            setError(
              'Invalid post ID.'
            )
          } else if (response.status === 401) {
            navigate(
              '/login',
              {
                replace: true,
              }
            )
            return
          } else if (response.status === 404) {
            setError(
              'Post not found.'
            )
          } else if (response.status === 403) {
            setError(
              'You do not have access to this post.'
            )
          } else {
            setError(
              message ||
                'Failed to load post.'
            )
          }

          return
        }

        const data = await response.json()

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
  }, [
    id,
    isValidPostID,
    navigate,
  ])

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
          if (response.status === 401) {
            navigate(
              '/login',
              {
                replace: true,
              }
            )
            return
          }

          console.error(
            'Failed to load current user:',
            response.status
          )
          return
        }

        const data = await response.json()

        setCurrentUser(data)
      } catch (error) {
        console.error(
          'Could not load current user:',
          error
        )
      }
    }

    loadCurrentUser()
  }, [navigate])

  useEffect(() => {
    loadSharedUsers()
  }, [loadSharedUsers])

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    try {
      setIsLoggingOut(true)
      setLogoutError('')

      const response = await fetch(
        'http://localhost:8080/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const { message } =
          await readErrorResponse(response)

        setLogoutError(
          message ||
            'Failed to log out.'
        )
        return
      }

      setCurrentUser(null)
      setIsLogoutModalOpen(false)

      navigate(
        '/login',
        {
          replace: true,
        }
      )
    } catch (error) {
      console.error(
        'Could not log out:',
        error
      )

      setLogoutError(
        'Could not connect to the server.'
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  function openLogoutModal() {
    setLogoutError('')
    setIsLogoutModalOpen(true)
  }

  function closeLogoutModal() {
    if (isLoggingOut) {
      return
    }

    setLogoutError('')
    setIsLogoutModalOpen(false)
  }

  function openCommentsModal(tab = 'comments') {
    setCommentError('')
    setCommentsTab(tab)
    setIsCommentsModalOpen(true)
  }

  function closeCommentsModal() {
    setCommentError('')
    setIsCommentsModalOpen(false)
  }

  function openShareModal() {
    setShareError('')
    setIsShareModalOpen(true)
  }

  function closeShareModal() {
    setShareUsername('')
    setShareError('')
    setIsShareModalOpen(false)
  }

  function openUnshareModal(userID, username) {
    setShareError('')
    setUnshareTarget({
      userID,
      username,
    })
  }

  function closeUnshareModal() {
    if (removingUserID !== null) {
      return
    }

    setShareError('')
    setUnshareTarget(null)
  }

  function openDeleteModal() {
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return
    }

    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  async function handleAddComment() {
    setCommentError('')

    if (!isValidPostID) {
      setCommentError(
        'Invalid post ID.'
      )
      return
    }

    const trimmedComment =
      commentText.trim()

    if (trimmedComment === '') {
      setCommentError(
        'Comment cannot be empty.'
      )
      return
    }

    if (isCommentSubmitting) {
      return
    }

    try {
      setIsCommentSubmitting(true)

      const response = await fetch(
        `http://localhost:8080/posts/${id}/comments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: trimmedComment,
          }),
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (code === 'UNAUTHORIZED') {
          setCommentError(
            'You must be logged in to comment.'
          )
        } else if (
          code === 'INVALID_POST_ID'
        ) {
          setCommentError(
            'Invalid post ID.'
          )
        } else if (
          code === 'INVALID_BODY'
        ) {
          setCommentError(
            'Invalid comment data.'
          )
        } else if (
          code === 'POST_NOT_FOUND'
        ) {
          setCommentError(
            'Post not found.'
          )
        } else if (
          code === 'POST_ACCESS_DENIED'
        ) {
          setCommentError(
            'You do not have access to comment on this post.'
          )
        } else if (
          code === 'EMPTY_COMMENT'
        ) {
          setCommentError(
            'Comment cannot be empty.'
          )
        } else if (
          code === 'INTERNAL_SERVER_ERROR'
        ) {
          setCommentError(
            'The server could not create the comment.'
          )
        } else {
          setCommentError(
            message ||
              'Failed to create comment.'
          )
        }

        return
      }

      await response.json()

      setCommentText('')
      setCommentError('')

      await loadComments()

      setCommentsTab('comments')
    } catch (error) {
      console.error(
        'Could not create comment:',
        error
      )

      setCommentError(
        'Could not connect to the server.'
      )
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  async function handleSharePost() {
    setShareError('')

    if (!isValidPostID) {
      setShareError(
        'Invalid post ID.'
      )
      return
    }

    if (!canManageSharing) {
      setShareError(
        'Only the owner of a private post can manage sharing.'
      )
      return
    }

    const trimmedUsername =
      shareUsername.trim()

    if (trimmedUsername === '') {
      setShareError(
        'Username cannot be empty.'
      )
      return
    }

    if (isSharing) {
      return
    }

    try {
      setIsSharing(true)

      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: trimmedUsername,
          }),
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (
          code === 'EMPTY_USERNAME'
        ) {
          setShareError(
            'Username cannot be empty.'
          )
        } else if (
          code === 'USER_NOT_FOUND'
        ) {
          setShareError(
            'User not found.'
          )
        } else if (
          code === 'CANNOT_SHARE_WITH_SELF'
        ) {
          setShareError(
            'You cannot share a post with yourself.'
          )
        } else if (
          code === 'ALREADY_SHARED'
        ) {
          setShareError(
            'This post is already shared with that user.'
          )
        } else if (
          code === 'POST_NOT_PRIVATE'
        ) {
          setShareError(
            'Only private posts can be shared.'
          )
        } else if (
          code === 'NOT_POST_OWNER'
        ) {
          setShareError(
            'Only the post owner can share this post.'
          )
        } else if (
          code === 'POST_NOT_FOUND' ||
          response.status === 404
        ) {
          setShareError(
            'Post not found.'
          )
        } else if (
          code === 'UNAUTHORIZED' ||
          response.status === 401
        ) {
          setShareError(
            'Your session has expired. Please log in again.'
          )
        } else {
          setShareError(
            message ||
              'Failed to share post.'
          )
        }

        return
      }

      setShareUsername('')
      setShareError('')

      await loadSharedUsers()
    } catch (error) {
      console.error(
        'Could not share post:',
        error
      )

      setShareError(
        'Could not connect to the server.'
      )
    } finally {
      setIsSharing(false)
    }
  }

  async function handleUnsharePost(userID) {
    setShareError('')

    const numericUserID =
      Number(userID)

    if (
      !Number.isInteger(numericUserID) ||
      numericUserID <= 0
    ) {
      setShareError(
        'Invalid user ID.'
      )
      return
    }

    if (!isValidPostID) {
      setShareError(
        'Invalid post ID.'
      )
      return
    }

    if (!canManageSharing) {
      setShareError(
        'Only the owner of a private post can manage sharing.'
      )
      return
    }

    if (removingUserID !== null) {
      return
    }

    try {
      setRemovingUserID(
        numericUserID
      )

      const response = await fetch(
        `http://localhost:8080/posts/${id}/shares/${numericUserID}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (
          code === 'SHARE_NOT_FOUND'
        ) {
          setShareError(
            'This user no longer has access.'
          )
        } else if (
          code === 'NOT_POST_OWNER'
        ) {
          setShareError(
            'Only the post owner can remove access.'
          )
        } else if (
          code === 'POST_NOT_PRIVATE'
        ) {
          setShareError(
            'Only private posts can be shared.'
          )
        } else if (
          code === 'POST_NOT_FOUND' ||
          response.status === 404
        ) {
          setShareError(
            'Post not found.'
          )
        } else if (
          code === 'UNAUTHORIZED' ||
          response.status === 401
        ) {
          setShareError(
            'Your session has expired. Please log in again.'
          )
        } else {
          setShareError(
            message ||
              'Failed to remove access.'
          )
        }

        return
      }

      setShareError('')
      setUnshareTarget(null)

      await loadSharedUsers()
    } catch (error) {
      console.error(
        'Could not remove shared user:',
        error
      )

      setShareError(
        'Could not connect to the server.'
      )
    } finally {
      setRemovingUserID(null)
    }
  }

  async function handleDeletePost() {
    setDeleteError('')

    if (!isValidPostID) {
      setDeleteError(
        'Invalid post ID.'
      )
      return
    }

    if (!isOwner) {
      setDeleteError(
        'Only the post owner can delete this post.'
      )
      return
    }

    if (isDeleting) {
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(
        `http://localhost:8080/posts/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const { code, message } =
          await readErrorResponse(response)

        if (
          code === 'INVALID_POST_ID' ||
          response.status === 400
        ) {
          setDeleteError(
            'Invalid post ID.'
          )
        } else if (
          code === 'POST_NOT_FOUND' ||
          response.status === 404
        ) {
          setDeleteError(
            'Post not found.'
          )
        } else if (
          code === 'NOT_POST_OWNER' ||
          response.status === 403
        ) {
          setDeleteError(
            'Only the post owner can delete this post.'
          )
        } else if (
          code === 'UNAUTHORIZED' ||
          response.status === 401
        ) {
          setDeleteError(
            'Your session has expired. Please log in again.'
          )
        } else {
          setDeleteError(
            message ||
              'Failed to delete post.'
          )
        }

        return
      }

      setIsDeleteModalOpen(false)

      navigate(
        '/home',
        {
          replace: true,
        }
      )
    } catch (error) {
      console.error(
        'Could not delete post:',
        error
      )

      setDeleteError(
        'Could not connect to the server.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="home-page">
        <div className="home-shell">
          <div className="detail-state">
            Loading post...
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="home-page">
        <div className="home-shell">
          <header className="home-navbar">
            <Link
              to="/home"
              className="home-brand"
            >
              <span className="brand-mark">
                MW
              </span>

              <span className="brand-name">
                MiniWeblog
              </span>
            </Link>
          </header>

          <div className="detail-state">
            <h2>
              Could not open this post
            </h2>

            <p>
              {error}
            </p>

            <Link
              to="/home"
              className="detail-back-link"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="home-page">
      <div className="home-shell">
        <header className="home-navbar">
          <Link
            to="/home"
            className="home-brand"
          >
            <span className="brand-mark">
              MW
            </span>

            <span className="brand-name">
              MiniWeblog
            </span>
          </Link>

          <div className="home-nav-actions">
            <Link
              to="/home"
              className="detail-home-button"
            >
              Home
            </Link>

            <button
              className="logout-button"
              onClick={openLogoutModal}
            >
              Logout
            </button>
          </div>
        </header>

        {post && (
          <article className="detail-content">
            <header className="detail-post-header">
              <div className="detail-title-row">
                <h1>
                  {post.Title}
                </h1>

                <span
                  className={`privacy-badge ${post.Privacy}`}
                >
                  {post.Privacy}
                </span>
              </div>

              <p className="detail-author">
                By{' '}
                <strong>
                  {post.AuthorUsername}
                </strong>
              </p>
            </header>

            {post.ImagePath && (
              <div className="detail-image-wrap">
                <img
                  className="detail-image"
                  src={`http://localhost:8080${post.ImagePath}`}
                  alt={post.Title}
                />
              </div>
            )}

            <div className="detail-post-body">
              <p>
                {post.Content}
              </p>
            </div>

            <nav
              className="detail-action-bar"
              aria-label="Post actions"
            >
              <button
                className="detail-action-button"
                onClick={() =>
                  openCommentsModal(
                    'comments'
                  )
                }
              >
                Comments
                <span className="detail-action-count">
                  {comments.length}
                </span>
              </button>

              {canManageSharing && (
                <button
                  className="detail-action-button"
                  onClick={openShareModal}
                >
                  Share
                  <span className="detail-action-count">
                    {sharedUsers.length}
                  </span>
                </button>
              )}

              {isOwner && (
                <button
                  className="detail-action-button detail-action-danger"
                  onClick={openDeleteModal}
                >
                  Delete
                </button>
              )}
            </nav>
          </article>
        )}
      </div>

      {isCommentsModalOpen && (
        <div
          className="detail-modal-overlay"
          onClick={closeCommentsModal}
        >
          <div
            className="detail-modal detail-comments-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-modal-header">
              <div>
                <p className="detail-modal-eyebrow">
                  DISCUSSION
                </p>

                <h2>
                  Join the conversation
                </h2>
              </div>

              <button
                className="detail-modal-close"
                onClick={closeCommentsModal}
                aria-label="Close comments"
              >
                ×
              </button>
            </div>

            <nav className="comments-tabs">
              <button
                className={
                  commentsTab === 'comments'
                    ? 'comments-tab active'
                    : 'comments-tab'
                }
                onClick={() =>
                  setCommentsTab(
                    'comments'
                  )
                }
              >
                Comments
                <span>
                  {comments.length}
                </span>
              </button>

              <button
                className={
                  commentsTab === 'write'
                    ? 'comments-tab active'
                    : 'comments-tab'
                }
                onClick={() => {
                  setCommentError('')
                  setCommentsTab(
                    'write'
                  )
                }}
              >
                Write a comment
              </button>
            </nav>

            <div className="comments-modal-body">
              {commentsTab === 'comments' && (
                <>
                  {commentsLoadError && (
                    <p className="form-error">
                      {commentsLoadError}
                    </p>
                  )}

                  {comments.length === 0 &&
                    !commentsLoadError && (
                      <div className="comments-empty">
                        <p>
                          No comments yet.
                        </p>

                        <button
                          className="detail-primary-button"
                          onClick={() =>
                            setCommentsTab(
                              'write'
                            )
                          }
                        >
                          Be the first to comment
                        </button>
                      </div>
                    )}

                  <div className="comments-list">
                    {comments.map((comment) => (
                      <article
                        className="comment-card"
                        key={comment.id}
                      >
                        <div className="comment-avatar">
                          {(comment.username?.[0] ||
                            '?').toUpperCase()}
                        </div>

                        <div className="comment-copy">
                          <strong>
                            {comment.username}
                          </strong>

                          <p>
                            {comment.text}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {commentsTab === 'write' && (
                <div className="comment-compose">
                  <label htmlFor="detail-comment">
                    Your comment
                  </label>

                  <textarea
                    id="detail-comment"
                    placeholder="Write something thoughtful..."
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(
                        event.target.value
                      )

                      setCommentError('')
                    }}
                  />

                  {commentError && (
                    <p className="form-error">
                      {commentError}
                    </p>
                  )}

                  <div className="detail-modal-actions">
                    <button
                      className="detail-secondary-button"
                      onClick={() =>
                        setCommentsTab(
                          'comments'
                        )
                      }
                    >
                      Cancel
                    </button>

                    <button
                      className="detail-primary-button"
                      onClick={handleAddComment}
                      disabled={isCommentSubmitting}
                    >
                      {isCommentSubmitting
                        ? 'Posting...'
                        : 'Post Comment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen &&
        canManageSharing && (
          <div
            className="detail-modal-overlay"
            onClick={closeShareModal}
          >
            <div
              className="detail-modal detail-share-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="detail-modal-header">
                <div>
                  <p className="detail-modal-eyebrow">
                    PRIVATE POST
                  </p>

                  <h2>
                    Share this post
                  </h2>

                  <p className="detail-modal-subtitle">
                    Give another user access by username.
                  </p>
                </div>

                <button
                  className="detail-modal-close"
                  onClick={closeShareModal}
                  aria-label="Close sharing"
                >
                  ×
                </button>
              </div>

              <div className="share-compose-row">
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
                  className="detail-primary-button"
                  onClick={handleSharePost}
                  disabled={isSharing}
                >
                  {isSharing
                    ? 'Sharing...'
                    : 'Share'}
                </button>
              </div>

              {shareError && (
                <p className="form-error">
                  {shareError}
                </p>
              )}

              <div className="shared-users-block">
                <div className="shared-users-heading">
                  <h3>
                    Shared with
                  </h3>

                  <span>
                    {sharedUsers.length}
                  </span>
                </div>

                {sharedUsers.length === 0 && (
                  <p className="shared-users-empty">
                    This post has not been shared with anyone yet.
                  </p>
                )}

                <div className="shared-users-list">
                  {sharedUsers.map((user) => {
                    const sharedUserID =
                      user.id ??
                      user.ID

                    const sharedUsername =
                      user.username ??
                      user.Username

                    return (
                      <div
                        className="shared-user-row"
                        key={sharedUserID}
                      >
                        <div className="shared-user-identity">
                          <span className="shared-user-avatar">
                            {(sharedUsername?.[0] ||
                              '?').toUpperCase()}
                          </span>

                          <strong>
                            {sharedUsername}
                          </strong>
                        </div>

                        <button
                          className="detail-remove-button"
                          onClick={() =>
                            openUnshareModal(
                              sharedUserID,
                              sharedUsername
                            )
                          }
                          disabled={
                            removingUserID !== null
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      {isDeleteModalOpen &&
        isOwner && (
          <div
            className="detail-modal-overlay"
            onClick={closeDeleteModal}
          >
            <div
              className="detail-modal detail-delete-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="delete-warning-mark">
                !
              </div>

              <h2>
                Delete this post?
              </h2>

              <p>
                This action cannot be undone. The post
                will no longer be available.
              </p>

              {deleteError && (
                <p className="form-error">
                  {deleteError}
                </p>
              )}

              <div className="detail-modal-actions detail-delete-actions">
                <button
                  className="detail-secondary-button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  className="detail-danger-button"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? 'Deleting...'
                    : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        )}

      {isLogoutModalOpen && (
        <div
          className="detail-modal-overlay"
          onClick={closeLogoutModal}
        >
          <div
            className="detail-modal detail-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-modal-header">
              <div>
                <p className="detail-modal-eyebrow">
                  ACCOUNT
                </p>

                <h2>
                  Log out?
                </h2>
              </div>

              <button
                className="detail-modal-close"
                onClick={closeLogoutModal}
                disabled={isLoggingOut}
                aria-label="Close logout confirmation"
              >
                ×
              </button>
            </div>

            <p className="detail-confirm-copy">
              Are you sure you want to log out?
            </p>

            {logoutError && (
              <p className="form-error">
                {logoutError}
              </p>
            )}

            <div className="detail-modal-actions">
              <button
                className="detail-secondary-button"
                onClick={closeLogoutModal}
                disabled={isLoggingOut}
              >
                Cancel
              </button>

              <button
                className="detail-primary-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? 'Logging out...'
                  : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {unshareTarget && (
        <div
          className="detail-modal-overlay"
          onClick={closeUnshareModal}
        >
          <div
            className="detail-modal detail-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-modal-header">
              <div>
                <p className="detail-modal-eyebrow">
                  SHARING
                </p>

                <h2>
                  Remove access?
                </h2>
              </div>

              <button
                className="detail-modal-close"
                onClick={closeUnshareModal}
                disabled={removingUserID !== null}
                aria-label="Close unshare confirmation"
              >
                ×
              </button>
            </div>

            <p className="detail-confirm-copy">
              Are you sure you want to remove{' '}
              <strong>
                {unshareTarget.username}
              </strong>
              {' '}from this post?
            </p>

            {shareError && (
              <p className="form-error">
                {shareError}
              </p>
            )}

            <div className="detail-modal-actions">
              <button
                className="detail-secondary-button"
                onClick={closeUnshareModal}
                disabled={removingUserID !== null}
              >
                Cancel
              </button>

              <button
                className="detail-danger-button"
                onClick={() =>
                  handleUnsharePost(
                    unshareTarget.userID
                  )
                }
                disabled={removingUserID !== null}
              >
                {removingUserID !== null
                  ? 'Removing...'
                  : 'Remove Access'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default PostDetailPage
