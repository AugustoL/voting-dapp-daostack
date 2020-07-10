const fs = require("fs");
// Get short commit hash from git
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();
const shortCommitHash = gitRevisionPlugin.commithash().substring(0,8);

fs.readFile("dist/app.bundle-"+shortCommitHash+".js", function(err, data) {
  if (err)
    throw (err);
  fs.writeFile(
    "dist/app.bundle-"+shortCommitHash+".js",
    data.toString().replace(new RegExp(process.cwd()+"/src/", 'gi'),
    "/"
  ), function(err){
    if (err)
      throw (err);
  });
})
