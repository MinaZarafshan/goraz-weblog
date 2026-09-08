import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])

  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftPrivacy, setDraftPrivacy] = useState('public')
  const [draftImage, setDraftImage] = useState(null)

  const [search, setSearch] = useState('')
  const [privacyFilter, setPrivacyFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [limit, setLimit] = useState(3)

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
        params.set('search', searchValue.trim())
      }

      if (privacyValue !== '') {
        params.set('privacy', privacyValue)
      }

      if (sortValue !== '') {
        params.set('sort', sortValue)
      }

      const response = await fetch(
        `http://localhost:8080/posts?${params.toString()}`,
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

      console.log('BACKEND DATA:', data)

      setPosts(data.posts)
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
    const newLimit = Number(event.target.value)

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

  async function handleAddPost() {
    if (draftTitle.trim() === '') {
      return
    }

    if (draftContent.trim() === '') {
      return
    }

    const formData = new FormData()

    formData.append('title', draftTitle)
    formData.append('content', draftContent)
    formData.append('privacy', draftPrivacy)

    if (draftImage) {
      formData.append('image', draftImage)
    }

    try {
      const response = await fetch(
        'http://localhost:8080/posts',
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to create post:',
          response.status
        )
        return
      }

      await response.json()

      setDraftTitle('')
      setDraftContent('')
      setDraftPrivacy('public')
      setDraftImage(null)

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
        const response = await fetch(
          'http://localhost:8080/auth/me',
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          console.error(
            'Failed to load user:',
            response.status
          )
          return
        }

        const data = await response.json()

        console.log('USER DATA:', data)

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
    <main>
      <h1>Home</h1>

      {user && (
        <p>
          Welcome {user.username}
        </p>
      )}

      <div>
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <button onClick={handleSearch}>
          Search
        </button>

        <button
          onClick={() =>
            handlePrivacyFilter('')
          }
        >
          All
        </button>

        <button
          onClick={() =>
            handlePrivacyFilter('public')
          }
        >
          Public
        </button>

        <button
          onClick={() =>
            handlePrivacyFilter('private')
          }
        >
          Private
        </button>

        <button
          onClick={() =>
            handleSort('newest')
          }
        >
          Newest
        </button>

        <button
          onClick={() =>
            handleSort('oldest')
          }
        >
          Oldest
        </button>

        <select
          value={limit}
          onChange={handleLimitChange}
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

      <h2>Posts</h2>

      {posts.map((post) => {
        return (
          <div key={post.ID}>
            <Link to={`/weblog/${post.ID}`}>
              {post.Title}
            </Link>

            <span>
              {' '}
              — {post.Privacy}
            </span>
          </div>
        )
      })}

      <div>
        <button
          onClick={handlePreviousPage}
          disabled={page <= 1}
        >
          Previous
        </button>

        <span>
          {' '}
          Page {page} of {totalPages}{' '}
        </span>

        <button
          onClick={handleNextPage}
          disabled={page >= totalPages}
        >
          Next
        </button>

        <p>
          Total posts: {totalPosts}
        </p>
      </div>

      <h2>Create post</h2>

      <input
        type="text"
        placeholder="Title"
        value={draftTitle}
        onChange={(event) =>
          setDraftTitle(event.target.value)
        }
      />

      <textarea
        placeholder="Write your post..."
        value={draftContent}
        onChange={(event) =>
          setDraftContent(event.target.value)
        }
      />

      <select
        value={draftPrivacy}
        onChange={(event) =>
          setDraftPrivacy(event.target.value)
        }
      >
        <option value="public">
          Public
        </option>

        <option value="private">
          Private
        </option>
      </select>

      <input
        type="file"
        onChange={(event) =>
          setDraftImage(event.target.files[0])
        }
      />

      <button onClick={handleAddPost}>
        Add post
      </button>
    </main>
  )
}

export default HomePage