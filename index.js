const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server');
const { GraphQLScalarType, defaultFieldResolver } = require('graphql');
const { Kind } = require('graphql/language');

class UpperCaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args);

      if (typeof result === 'string') {
        return result.toUpperCase();
      }
      return result;
    };
  }
}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  directive @upper on FIELD_DEFINITION

  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # 高度
  enum HeightUnit {
    METRE
    CENTIMETER
    FOOT
  }

  # 重量
  enum WeightUnit {
    KILOGRAM
    GRAM
    POUND
  }

  # This "User" type defines the queryable fields for every user in our data source.
  type User {
    id: Int
    name: String! @upper
    age: Int
    friends: [User]
    posts: [Post]
    height(unit: HeightUnit = CENTIMETER): Float
    weight(unit: WeightUnit = KILOGRAM): Float @deprecated (reason: "It's secret")
  }

  # This "Pots" type defines the queryable fields for every pos in our data source.
  type Post {
    id: Int!
    author: User
    title: String
    content: String
    likeGivers: [User]
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).

  scalar Date

  type Query {
    self: User
    user(id: Int!): User
    users: [User]
    usersHeight(unit: HeightUnit = CENTIMETER): [Float]
    posts: [Post]
    now: Date
    isFriday(date: Date!): Boolean,
  }

  # input object type
  input AddPostInput {
    title: String!
    content: String
  }

  # Mutation
  type Mutation {
    addPost(post: AddPostInput): Post
    likePost(id: Int!): Post
  }
`;

const users = [
  {
    id: 1,
    name: 'leo',
    age: 20,
    friends: [2],
    height: 175,
    weight: 75
  },
  {
    id: 2,
    name: 'woody',
    age: 20,
    friends: [],
    height: 168,
    weight: 60
  }
]

const posts = [
  { id: 1, authorId: 1, title: "1", content: "This is my first post.", likeGiverIds: [2] },
  { id: 2, authorId: 2, title: "2", content: "My name is woody!!", likeGiverIds: [1] },
  { id: 3, authorId: 1, title: "3", content: "Here's my second post.", likeGiverIds: [] },
];

const HeightValue = {
  METRE: 100,
  CENTIMETER: 1,
  FOOT: 30.48
}

const WeightValue = {
  KILOGRAM: 1,
  GRAM: 100,
  POUND: 0.45
}

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    self: () => users.find(user => user.id === 1),
    user: (root, args, context) => users.find(user => user.id === args.id),
    users: () => users,
    usersHeight: (root, args, context) => users.map(item => getValue('height', item.height, args.unit)),
    posts: () => posts,
    now: () => new Date(),
    isFriday: (root, { date }) => date.getDay() === 5
  },
  Mutation: {
    addPost: (root, args) => {
      const { title, content } = args.post
      const newPost = {
        id: posts.length + 1,
        authorId: 1,
        likeGiverIds: [],
        title,
        content
      }
      posts.push(newPost)
      return newPost
    },
    likePost: (root, args) => {
      const post = posts.find(item => item.id === args.id)
      if (!post) throw new Error('error')

      const { likeGiverIds } = post

      likeGiverIds.includes(1) 
        ? likeGiverIds.splice(likeGiverIds.findIndex(item => item.id === 1), 1)
        : likeGiverIds.push(1)
      
      return post
    }
  },
  User: {
    friends: (parent) => users.filter(user => parent.friends.includes(user.id)),
    posts: (parent) => posts.filter(post => post.authorId === parent.id),
    height: (parent, args) => getValue('height', parent.height, args.unit),
    weight: (parent, args) => getValue('weight', parent.weight, args.unit)
  },
  Post: {
    author: (parent) => users.find(user => user.id === parent.authorId),
    likeGivers: (parent) => parent.likeGiverIds.map(id => users.find(user => user.id === id)),
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'custom scalar type',
    serialize(value) {
      return value.getTime();
    },
    parseValue(value) {
      return new Date(value);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10)); // ast value is always in string format
      }
      return null;
    }
  }),
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers, schemaDirectives: {
  upper: UpperCaseDirective
}});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});


// utils

const getValue = (type, value, unit) => {
  const unitValues = type === 'weight' ? WeightValue : HeightValue
  
  if (!Object.keys(unitValues).includes(unit)) {
    throw new Error('error')
  }
  return value * unitValues[unit]
}