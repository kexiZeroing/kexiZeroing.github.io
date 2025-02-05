// https://github.com/IsaacGemal/wikitok
import { useEffect, useRef, useCallback, useState } from 'react'

export default function FullSlider() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const observerTarget = useRef(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=5`
      )
      const newPosts = await response.json()
      
      setPosts(prev => [...prev, ...newPosts])
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [page])

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries
      if (target.isIntersecting && !loading) {
        fetchPosts()
      }
    },
    [loading, fetchPosts]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    })

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory">
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.reload()}
          className="text-2xl font-bold text-white drop-shadow-lg hover:opacity-80 transition-opacity"
        >
          Blog Posts
        </button>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="h-screen w-full flex items-center justify-center snap-start relative">
          <div className="max-w-2xl p-8 rounded-lg bg-gray-800 bg-opacity-50">
            <h2 className="text-3xl font-bold mb-6 capitalize">{post.title}</h2>
            <p className="text-lg mb-4 leading-relaxed">{post.body}</p>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Post ID: {post.id}</span>
              <span>User ID: {post.userId}</span>
            </div>
          </div>
        </div>
      ))}
      <div ref={observerTarget} className="h-10" />
      
      {loading && (
        <div className="h-screen w-full flex items-center justify-center gap-2">
          <span>Loading...</span>
        </div>
      )}
    </div>
  )
}