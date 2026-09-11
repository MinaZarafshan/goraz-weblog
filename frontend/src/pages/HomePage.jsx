import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function HomePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])

  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftPrivacy, setDraftPrivacy] = useState('public')
  const [draftImage, setDraftImage] = useState(null)

  const [titleError, setTitleError] = useState('')
  const [contentError, setContentError] = useState('')
  const [privacyError, setPrivacyError] = useState('')
  const [imageError, setImageError] = useState('')
  const [createError, setCreateError] = useState('')
  const [logoutError, setLogoutError] = useState('')

  const [isLogoutModalOpen, setIsLogoutModalOpen] =
    useState(false)

  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  const [search, setSearch] = useState('')
  const [privacyFilter, setPrivacyFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [limit, setLimit] = useState(3)

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false)

  async function loadPosts(
    searchValue = '',
    privacyValue = '',
    sortValue = 'newest',
    pageValue = 1,
    limitValue = 3
  ) {
    try {
      const params = new URLSearchParams()

      params.set('page', pageValue)
      params.set('limit', limitValue)

      if (searchValue.trim() !== '') {
        params.set(
          'search',
          searchValue.trim()
        )
      }

      if (privacyValue !== '') {
        params.set(
          'privacy',
          privacyValue
        )
      }

      if (sortValue !== '') {
        params.set(
          'sort',
          sortValue
        )
      }

      const response = await fetch(
        `/api/posts?${params.toString()}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to load posts:',
          response.status
        )
        return
      }

      const data = await response.json()

      setPosts(
        Array.isArray(data.posts)
          ? data.posts
          : []
      )

      setPage(data.page)
      setTotalPages(data.total_pages)
      setTotalPosts(data.total)
    } catch (error) {
      console.error(
        'Could not connect to backend:',
        error
      )
    }
  }

  function handleSearch() {
    loadPosts(
      search,
      privacyFilter,
      sortOrder,
      1,
      limit
    )
  }

  function handlePrivacyFilter(value) {
    setPrivacyFilter(value)

    loadPosts(
      search,
      value,
      sortOrder,
      1,
      limit
    )
  }

  function handleSort(value) {
    setSortOrder(value)

    loadPosts(
      search,
      privacyFilter,
      value,
      1,
      limit
    )
  }

  function handleLimitChange(event) {
    const newLimit =
      Number(event.target.value)

    setLimit(newLimit)

    loadPosts(
      search,
      privacyFilter,
      sortOrder,
      1,
      newLimit
    )
  }

  function handlePreviousPage() {
    if (page > 1) {
      loadPosts(
        search,
        privacyFilter,
        sortOrder,
        page - 1,
        limit
      )
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      loadPosts(
        search,
        privacyFilter,
        sortOrder,
        page + 1,
        limit
      )
    }
  }

  function handleImageChange(event) {
    const file =
      event.target.files[0]

    setImageError('')
    setCreateError('')
    setDraftImage(file || null)
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    try {
      setIsLoggingOut(true)
      setLogoutError('')

      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        let message =
          'Failed to log out.'

        try {
          const data =
            await response.json()

          message =
            data.error ||
            data.Error ||
            message
        } catch {
          // Keep generic message.
        }

        setLogoutError(message)
        return
      }

      setUser(null)
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

  async function handleAddPost() {
    setTitleError('')
    setContentError('')
    setPrivacyError('')
    setImageError('')
    setCreateError('')

    let hasFrontendError = false

    if (
      draftTitle.trim() === ''
    ) {
      setTitleError(
        'Title is required.'
      )

      hasFrontendError = true
    }

    if (
      draftContent.trim() === ''
    ) {
      setContentError(
        'Content is required.'
      )

      hasFrontendError = true
    }

    if (
      draftPrivacy !== 'public' &&
      draftPrivacy !== 'private'
    ) {
      setPrivacyError(
        'Privacy must be public or private.'
      )

      hasFrontendError = true
    }

    if (hasFrontendError) {
      return
    }

    const formData =
      new FormData()

    formData.append(
      'title',
      draftTitle
    )

    formData.append(
      'content',
      draftContent
    )

    formData.append(
      'privacy',
      draftPrivacy
    )

    if (draftImage) {
      formData.append(
        'image',
        draftImage
      )
    }

    try {
      const response = await fetch(
        '/api/posts',
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      if (!response.ok) {
        let data = {}

        try {
          data =
            await response.json()
        } catch {
          setCreateError(
            'The server returned an invalid response.'
          )
          return
        }

        const code =
          data.code ||
          data.Code ||
          ''

        const backendMessage =
          data.error ||
          data.Error ||
          ''

        console.error(
          'CREATE POST ERROR:',
          {
            status:
              response.status,
            code,
            backendMessage,
            data,
          }
        )

        if (
          code === 'EMPTY_TITLE'
        ) {
          setTitleError(
            'Title is required.'
          )
        } else if (
          code === 'EMPTY_CONTENT'
        ) {
          setContentError(
            'Content is required.'
          )
        } else if (
          code === 'INVALID_PRIVACY'
        ) {
          setPrivacyError(
            'Privacy must be public or private.'
          )
        } else if (
          code === 'INVALID_IMAGE_UPLOAD'
        ) {
          setImageError(
            'The image upload is invalid.'
          )
        } else if (
          code === 'IMAGE_TOO_LARGE'
        ) {
          setImageError(
            'Image must be 5 MB or smaller.'
          )
        } else if (
          code === 'EMPTY_IMAGE'
        ) {
          setImageError(
            'The selected image is empty.'
          )
        } else if (
          code === 'INVALID_IMAGE_TYPE'
        ) {
          setImageError(
            'Only valid JPEG, PNG, and WEBP images are allowed.'
          )
        } else if (
          code === 'IMAGE_OPEN_ERROR'
        ) {
          setImageError(
            'The server could not open the uploaded image.'
          )
        } else if (
          code === 'IMAGE_READ_ERROR'
        ) {
          setImageError(
            'The server could not read the uploaded image.'
          )
        } else if (
          code === 'IMAGE_SEEK_ERROR'
        ) {
          setImageError(
            'The server could not process the uploaded image.'
          )
        } else if (
          code === 'IMAGE_SAVE_ERROR'
        ) {
          setImageError(
            'The server could not save the uploaded image.'
          )
        } else if (
          code === 'UNAUTHORIZED'
        ) {
          setCreateError(
            'Your session has expired. Please log in again.'
          )
        } else if (
          code === 'INTERNAL_ERROR'
        ) {
          setCreateError(
            'The server could not create the post. Please try again.'
          )
        } else if (
          code.startsWith(
            'IMAGE_'
          )
        ) {
          setImageError(
            backendMessage ||
              'The image could not be processed.'
          )
        } else {
          setCreateError(
            backendMessage ||
              'Failed to create post.'
          )
        }

        return
      }

      await response.json()

      setDraftTitle('')
      setDraftContent('')
      setDraftPrivacy('public')
      setDraftImage(null)

      setTitleError('')
      setContentError('')
      setPrivacyError('')
      setImageError('')
      setCreateError('')

      setIsCreateModalOpen(false)

      await loadPosts(
        search,
        privacyFilter,
        sortOrder,
        1,
        limit
      )
    } catch (error) {
      console.error(
        'Could not create post:',
        error
      )

      setCreateError(
        'Could not connect to the server.'
      )
    }
  }

  useEffect(() => {
    async function loadInitialPosts() {
      await loadPosts(
        '',
        '',
        'newest',
        1,
        3
      )
    }

    loadInitialPosts()
  }, [])

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await fetch(
            '/api/auth/me',
            {
              credentials:
                'include',
            }
          )

        if (!response.ok) {
          console.error(
            'Failed to load user:',
            response.status
          )
          return
        }

        const data =
          await response.json()

        setUser(data)
      } catch (error) {
        console.error(
          'Could not load user:',
          error
        )
      }
    }

    loadUser()
  }, [])

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
            <button
              className="create-nav-button"
              onClick={() => {
                setTitleError('')
                setContentError('')
                setPrivacyError('')
                setImageError('')
                setCreateError('')

                setIsCreateModalOpen(
                  true
                )
              }}
            >
              Create Post
            </button>

            <button
              className="logout-button"
              onClick={openLogoutModal}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="home-content">
          <section className="home-intro">
            <h1>
              Your Feed
            </h1>

            {user && (
              <p>
                Welcome,{' '}

                <strong>
                  {user.username}
                </strong>
              </p>
            )}
          </section>

          <section className="feed-controls">
            <div className="search-row">
              <input
                className="search-input"
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <button
                className="search-button"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <span className="filter-label">
                  Privacy
                </span>

                <button
                  className={
                    privacyFilter === ''
                      ? 'filter-button active'
                      : 'filter-button'
                  }
                  onClick={() =>
                    handlePrivacyFilter(
                      ''
                    )
                  }
                >
                  All
                </button>

                <button
                  className={
                    privacyFilter === 'public'
                      ? 'filter-button active'
                      : 'filter-button'
                  }
                  onClick={() =>
                    handlePrivacyFilter(
                      'public'
                    )
                  }
                >
                  Public
                </button>

                <button
                  className={
                    privacyFilter === 'private'
                      ? 'filter-button active'
                      : 'filter-button'
                  }
                  onClick={() =>
                    handlePrivacyFilter(
                      'private'
                    )
                  }
                >
                  Private
                </button>
              </div>

              <div className="filter-group">
                <span className="filter-label">
                  Sort
                </span>

                <button
                  className={
                    sortOrder === 'newest'
                      ? 'filter-button active'
                      : 'filter-button'
                  }
                  onClick={() =>
                    handleSort(
                      'newest'
                    )
                  }
                >
                  Newest
                </button>

                <button
                  className={
                    sortOrder === 'oldest'
                      ? 'filter-button active'
                      : 'filter-button'
                  }
                  onClick={() =>
                    handleSort(
                      'oldest'
                    )
                  }
                >
                  Oldest
                </button>
              </div>

              <select
                className="limit-select"
                value={limit}
                onChange={
                  handleLimitChange
                }
              >
                <option value="3">
                  3 per page
                </option>

                <option value="5">
                  5 per page
                </option>

                <option value="10">
                  10 per page
                </option>
              </select>
            </div>
          </section>

          <section className="posts-section">
            <div className="posts-heading">
              <h2>
                Posts
              </h2>

              <span>
                {totalPosts} posts
              </span>
            </div>

            <div className="post-list">
              {posts.map((post) => {
                return (
                  <div
                    className="post-row"
                    key={post.ID}
                  >
                    <div className="post-info">
                      <Link
                        className="post-link"
                        to={`/weblog/${post.ID}`}
                      >
                        {post.Title}
                      </Link>

                      <span className="post-date">
                        {formatDateTime(
                          post.CreatedAt ??
                          post.created_at
                        )}
                      </span>
                    </div>

                    <span
                      className={`privacy-badge ${post.Privacy}`}
                    >
                      {post.Privacy}
                    </span>
                  </div>
                )
              })}
            </div>

            {posts.length === 0 && (
              <p className="empty-posts">
                No posts found.
              </p>
            )}
          </section>

          <div className="pagination">
            <button
              onClick={
                handlePreviousPage
              }
              disabled={page <= 1}
            >
              Previous
            </button>

            <span>
              Page {page} of{' '}
              {Math.max(
                totalPages,
                1
              )}
            </span>

            <button
              onClick={
                handleNextPage
              }
              disabled={
                page >= totalPages
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="create-modal">
            <div className="modal-header">
              <div>
                <p>
                  NEW POST
                </p>

                <h2>
                  Create a post
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  setTitleError('')
                  setContentError('')
                  setPrivacyError('')
                  setImageError('')
                  setCreateError('')

                  setIsCreateModalOpen(
                    false
                  )
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <input
                type="text"
                placeholder="Title"
                value={draftTitle}
                onChange={(event) => {
                  setDraftTitle(
                    event.target.value
                  )

                  setTitleError('')
                  setCreateError('')
                }}
              />

              {titleError && (
                <p className="form-error">
                  {titleError}
                </p>
              )}

              <textarea
                placeholder="Write your post..."
                value={draftContent}
                onChange={(event) => {
                  setDraftContent(
                    event.target.value
                  )

                  setContentError('')
                  setCreateError('')
                }}
              />

              {contentError && (
                <p className="form-error">
                  {contentError}
                </p>
              )}

              <select
                value={draftPrivacy}
                onChange={(event) => {
                  setDraftPrivacy(
                    event.target.value
                  )

                  setPrivacyError('')
                  setCreateError('')
                }}
              >
                <option value="public">
                  Public
                </option>

                <option value="private">
                  Private
                </option>
              </select>

              {privacyError && (
                <p className="form-error">
                  {privacyError}
                </p>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleImageChange
                }
              />

              {imageError && (
                <p className="form-error">
                  {imageError}
                </p>
              )}

              {createError && (
                <p className="form-error">
                  {createError}
                </p>
              )}

              <button
                className="publish-button"
                onClick={
                  handleAddPost
                }
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {isLogoutModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeLogoutModal}
        >
          <div
            className="create-modal confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p>
                  ACCOUNT
                </p>

                <h2>
                  Log out?
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={
                  closeLogoutModal
                }
                disabled={
                  isLoggingOut
                }
                aria-label="Close logout confirmation"
              >
                ×
              </button>
            </div>

            <div className="confirm-modal-body">
              <p>
                Are you sure you want to log out?
              </p>

              {logoutError && (
                <p className="form-error">
                  {logoutError}
                </p>
              )}

              <div className="confirm-modal-actions">
                <button
                  className="confirm-cancel-button"
                  onClick={
                    closeLogoutModal
                  }
                  disabled={
                    isLoggingOut
                  }
                >
                  Cancel
                </button>

                <button
                  className="confirm-primary-button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    isLoggingOut
                  }
                >
                  {isLoggingOut
                    ? 'Logging out...'
                    : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage