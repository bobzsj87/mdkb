#What is mdkb
Markdown Knowledge Base, mdkb, is a multi-language knowledge base using markdown and filesystem. It does not depend on any data base

#How does it work?
- A markdown parser
- Website url is based on the directory structure
- If index.ejs is specified in a directory, the page will be rendered by index.ejs, otherwise the directory content will be listed
- Customizable ignore files, document location and layout

#How to use it?
- Clone the repo and npm install, and cp config.sample.json to config.json
- Make your own contents. You can find an example here <https://github.com/bobzsj87/camp-kb>
- Change the docpath to the markdown contents, you should use absolute path
- run ./bin/www and see what happens