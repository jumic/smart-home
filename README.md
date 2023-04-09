# replace this

ng new smart-home-frontend
? Would you like to add Angular routing? (y/N) 
--> y


mv smart-home-frontend frontend

yarn add aws-amplify

yarn add @ng-bootstrap/ng-bootstrap
yarn add bootstrap
yarn add @popperjs/core

 yarn add bootstrap-icons

➜  frontend git:(main) ✗ cp ../schema.graphql .
➜  frontend git:(main) ✗ amplify codegen       
code generation is not configured. Configure it by running 
$amplify codegen add
➜  frontend git:(main) ✗ amplify codegen add
? Choose the type of app that you're building javascript
? What javascript framework are you using angular
? Choose the code generation language target angular
? Enter the file name pattern of graphql queries, mutations and subscriptions src/graphql/**/*.graphql
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2
? Enter the file name for the generated code src/app/API.service.ts
? Do you want to generate code for your newly created GraphQL API Yes
✔ Generated GraphQL operations successfully and saved at src/graphql
✔ Code generated successfully and saved in file src/app/API.service.ts


amplify codegen