const dgraph = require("dgraph-js");
const grpc = require("grpc");

const clientStub = new dgraph.DgraphClientStub(
  // "localhost:9080",
  // grpc.credentials.createInsecure(),
);

const dgraphClient = new dgraph.DgraphClient(clientStub);

// console.log(Object.keys(dgraph))

async function main () {
  const schema = `
name: string @index(term) .
friends: [uid] @count @reverse .

type User {
  name
  friends
}
`;

  const op = new dgraph.Operation();
  op.setSchema(schema);
  const response = await dgraphClient.alter(op);

  console.log('Set Schema', response);

//   const RDFmutation = `
// {
//   "set {
//     _:michael <name> "Michael" .
//     _:michael <dgraph.type> "User" .
//     _:michael <friends> _:sarah .
//     _:michael <friends> _:jimmy .
// 
//     _:sarah <name> "Sarah" .
//     _:sarah <dgraph.type> "User" .
//     _:sarah <friends> _:michael .
//     _:sarah <friends> _:preston .
// 
//     _:jimmy <name> "Jimmy" .
//     _:jimmy <dgraph.type> "User" .
//     _:jimmy <friends> _:michael .
//     _:jimmy <friends> _:preston .
// 
//     _:preston <name> "Preston" .
//     _:preston <dgraph.type> "User" .
//     _:preston <friends> _:sarah .
//     _:preston <friends> _:jimmy .
//   }
// }
// `

  const JSONmutation = {
    name: "Michael",
    friends: [
      {
        name: "Sarah",
        friends: [
          {
            name: "Preston",
            friends: []
          }
        ]
      },
      {
        name: "Jimmy",
        friends: []
      }
    ],
  }

  const txn = dgraphClient.newTxn(); 
  const mu = new dgraph.Mutation();
  mu.setSetJson(JSONmutation);
  const response2 = await txn.mutate(mu);
  await txn.commit();
  console.log('Added Users', response2);

  const query = `
query all($a: string) {
  all(func: eq(name, $a)) {
    name
    friends {
      name
    }
  }
}`;

  const vars = { $a: "Sarah" };
  const res = await dgraphClient.newTxn({ readOnly: true }).queryWithVars(query, vars);
  const ppl = res.getJson();
  
  // Print results.
  console.log(`Number of people named "Sarah": ${ppl.all.length}`);
  ppl.all.forEach((person) => console.log(person));
}

main()
