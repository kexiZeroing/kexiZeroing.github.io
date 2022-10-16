---
layout: "../layouts/BlogPost.astro"
title: "React API evolution"
slug: react-api-evolution
description: ""
added: "Sep 20 2020"
---

Read similar articles to learn more about React:
- https://frantic.im/react-api-evolution
- https://pomb.us/build-your-own-react
- https://github.com/7kms/react-illustration-series

```js
// before ES6 class
const ReposGrid = React.createClass({
  getInitialState () {
    return {
      repos: [],
      loading: true
    }
  },
  componentDidMount () {
    this.updateRepos(this.props.id)
  },
  componentDidUpdate (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.updateRepos(this.props.id)
    }
  },
  updateRepos (id) {
    this.setState({ loading: true })

    fetchRepos(id)
      .then((repos) => this.setState({
        repos,
        loading: false
      }))
  },
  render() {
    const { loading, repos } = this.state

    if (loading === true) {
      return <Loading />
    }

    return (
      <ul>
        {repos.map(({ name, handle, stars, url }) => (
          <li key={name}>
            <ul>
              <li><a href={url}>{name}</a></li>
              <li>@{handle}</li>
              <li>{stars} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
})

// with native JavaScript class
class ReposGrid extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      repos: [],
      loading: true
    }

    this.updateRepos = this.updateRepos.bind(this)
  }
  componentDidMount () {
    this.updateRepos(this.props.id)
  }
  componentDidUpdate (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.updateRepos(this.props.id)
    }
  }
  updateRepos (id) {
    this.setState({ loading: true })

    fetchRepos(id)
      .then((repos) => this.setState({
        repos,
        loading: false
      }))
  }
  render() {
    if (this.state.loading === true) {
      return <Loading />
    }

    return (
      <ul>
        {this.state.repos.map(({ name, handle, stars, url }) => (
          <li key={name}>
            <ul>
              <li><a href={url}>{name}</a></li>
              <li>@{handle}</li>
              <li>{stars} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

// with Class Fields and use arrow functions 
class ReposGrid extends React.Component {
  state = {
    repos: [],
    loading: true
  }
  componentDidMount () {
    this.updateRepos(this.props.id)
  }
  componentDidUpdate (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.updateRepos(this.props.id)
    }
  }
  updateRepos = (id) => {
    this.setState({ loading: true })

    fetchRepos(id)
      .then((repos) => this.setState({
        repos,
        loading: false
      }))
  }
  render() {
    const { loading, repos } = this.state

    if (loading === true) {
      return <Loading />
    }

    return (
      <ul>
        {repos.map(({ name, handle, stars, url }) => (
          <li key={name}>
            <ul>
              <li><a href={url}>{name}</a></li>
              <li>@{handle}</li>
              <li>{stars} stars</li>
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

// Sharing Non-visual Logic and Higher-Order Component (HOC)
function withRepos (Component) {
  return class WithRepos extends React.Component {
    state = {
      repos: [],
      loading: true
    }
    componentDidMount () {
      this.updateRepos(this.props.id)
    }
    componentDidUpdate (prevProps) {
      if (prevProps.id !== this.props.id) {
        this.updateRepos(this.props.id)
      }
    }
    updateRepos = (id) => {
      this.setState({ loading: true })

      fetchRepos(id)
        .then((repos) => this.setState({
          repos,
          loading: false
        }))
    }
    render () {
      return (
        <Component
          {...this.props}
          {...this.state}
        />
      )
    }
  }
}
// Profile.js
function Profile ({ loading, repos }) {
  // ...
}
export default withRepos(Profile);


/* 
Here’s where we’re at:
- We use Classes for React components.
- Calling super(props) is annoying.
- No one knows how “this” works.
- Organizing components by lifecycle methods forces us to sprinkle related logic throughout our components.
- React couples UI to a component. No good way for sharing non-visual logic (HOC is convoluted). 

React Hooks give the answer:
- State -> useState
- Lifecycle methods -> useEffect
- Sharing non-visual logic -> custom hooks that are decoupled from any UI
*/

function ReposGrid ({ id }) {
  const [ repos, setRepos ] = React.useState([])
  const [ loading, setLoading ] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)

    fetchRepos(id)
      .then((repos) => {
        setRepos(repos)
        setLoading(false)
      })
  }, [id])

  if (loading === true) {
    return <Loading />
  }

  return (
    <ul>
      {repos.map(({ name, handle, stars, url }) => (
        <li key={name}>
          <ul>
            <li><a href={url}>{name}</a></li>
            <li>@{handle}</li>
            <li>{stars} stars</li>
          </ul>
        </li>
      ))}
    </ul>
  )
}

// custom useRepos Hook
function useRepos (id) {
  const [ repos, setRepos ] = React.useState([])
  const [ loading, setLoading ] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)

    fetchRepos(id)
      .then((repos) => {
        setRepos(repos)
        setLoading(false)
      })
  }, [id])

  return [ loading, repos ]
}

function ReposGrid ({ id }) {
  const [ loading, repos ] = useRepos(id)
  // ...
}
function Profile ({ user }) {
  const [ loading, repos ] = useRepos(user.id)
  // ...
}
```