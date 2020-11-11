# graphql-server-example

# arguments

```
query {
  user(name: "leo") {
    name
    age
    height(unit: FOOT)
  }
}
```

# variables

```
query ($name: String!) {
  user(name: $name) {
    id
    name
  },
}

{
  "name": "leo"
}
```

# fragment, operation name, aliases

```
query UserData($name1: String!, $name2: String!) {
  user1: user(name: $name1) {
    ...userData
  },
  user2: user(name: $name2) {
    ...userData
  }
}

fragment userData on User {
  name
  height
  weight
}
```

# mutation

```
mutation  {
  addPost(title: "4", content: "Here's my third post.") {
    author {
      name
    }
    title
    content
    likeGivers {
      name
    }
  }
}
```

# input object type

```
type Mutation {
  addPost(title: String!, content: String!): Post
}

```

vs

```
# Mutation
  input AddPostInput {
    title: String!
    content: String
  }

  type Mutation {
    addPost(post: AddPostInput): Post
  }
```