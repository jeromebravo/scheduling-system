$("#file").on("change", function(){
    var fileName = $(this).val();
    fileName = split(fileName)
    $(this).next(".custom-file-label").html(fileName);
});

function split(str){
    return str.split("\\").pop().split("/").pop();
}