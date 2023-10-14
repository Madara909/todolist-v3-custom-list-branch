var express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const serverless=require("serverless-http");

const app = express();
app.set('view engine', 'ejs');
const router = express.Router();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://Sashank-Bh:testing123@todo-list0.h8rnldb.mongodb.net/ToDoList?retryWrites=true&w=majority" );

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//get route "/"
app.get("/", async function(req, res) {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
        try{
            Item.insertMany(defaultItems);
            console.log("Successfully savevd default items to DB");
          }
          catch(err){
            console.log(err);
            handleError(err);
          }
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
});


//get custom list route
app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  let foundList;
  try {
    foundList= await List.findOne({name: customListName});
  } catch (error) {
    console.log(error.message);
  }
  if (foundList===null){
    //Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    //Show an existing list
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  }


//   List.findOne({name: customListName}, function(err, foundList){
//     if (!err){
//       if (!foundList){
//         //Create a new list
//         const list = new List({
//           name: customListName,
//           items: defaultItems
//         });
//         list.save();
//         res.redirect("/" + customListName);
//       } else {
//         //Show an existing list
//         res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
//       }
//     }
//   });
});

// post route "/"
app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    const que= await List.findOne({name: listName});
    que.items.push(item);
    que.save();
    res.redirect("/" + listName);
  }
});

//post delete from list route 
app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
        await Item.deleteOne({ _id: checkedItemId});
        console.log("Successfully deleted checked item.");
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }

  } else {
    try {
        await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});    
    } catch (error) {
        console.log(error.message);
    }
    res.redirect("/" + listName);
  }

});


// functionalities
app.get("/about", function(req, res){
  res.render("about");
});

app.use("/app/", router);

export const handler = serverless(app);

// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });
