import { useEffect, useState } from 'react'

function HomePage() {
  const user = {
    id: 1,
    username: 'mina',
  }

  const [posts, setPosts] = useState([])

  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftPrivacy, setDraftPrivacy] = useState('public')
  const [draftImage, setDraftImage] = useState(null)

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
      const response = await fetch('http://localhost:8080/posts', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        console.error('Failed to create post:', response.status)
        return
      }

      const newPost = await response.json()

      setPosts([
        newPost,
        ...posts,
      ])

      setDraftTitle('')
      setDraftContent('')
      setDraftPrivacy('public')
      setDraftImage(null)
    } catch (error) {
      console.error('Could not create post:', error)
    }
  }

  async function handleDeletePost(postID) {
    try {
      const response = await fetch(
        `http://localhost:8080/posts/${postID}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error('Failed to delete post:', response.status)
        return
      }

      const updatedPosts = posts.filter((post) => {
        return post.ID !== postID
      })

      setPosts(updatedPosts)
    } catch (error) {
      console.error('Could not delete post:', error)
    }
  }

  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await fetch('http://localhost:8080/posts', {
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Failed to load posts:', response.status)
          return
        }

        const data = await response.json()

        console.log('BACKEND DATA:', data)

        setPosts(data.posts)
      } catch (error) {
        console.error('Could not connect to backend:', error)
      }
    }

    loadPosts()
  }, [])

  return (
    <main>
      <h1>Home</h1>

      <p>Welcome {user.username}</p>

      <h2>Posts</h2>

      {posts.map((post) => {
        return (
          <div key={post.ID}>
            <h3>{post.Title}</h3>
            <p>{post.Content}</p>
            {post.ImagePath && (
              <img
                src={`http://localhost:8080${post.ImagePath}`}
                alt={post.Title}
                width="300"
              />
            )}
            <button onClick={() => handleDeletePost(post.ID)}>
              Delete
            </button>
          </div>
        )
      })}

      <h2>Create post</h2>

      <input
        type="text"
        placeholder="Title"
        value={draftTitle}
        onChange={(event) => setDraftTitle(event.target.value)}
      />

      <textarea
        placeholder="Write your post..."
        value={draftContent}
        onChange={(event) => setDraftContent(event.target.value)}
      />

      <select
        value={draftPrivacy}
        onChange={(event) => setDraftPrivacy(event.target.value)}
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>

      <input
        type="file"
        onChange={(event) => setDraftImage(event.target.files[0])}
      />

      <button onClick={handleAddPost}>
        Add post
      </button>
    </main>
  )
}

export default HomePage