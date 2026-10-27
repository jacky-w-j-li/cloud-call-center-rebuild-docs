exports.handle = function(req,res){
    console.log('=======================');
    //console.log(req.body);
    var upFile = req.files.upload;
    console.log(upFile);
    var result = {
      filePath : upFile.path,
      fileName :upFile.name
    };
    res.json(result);
}