// globals
const dotenv              = require("dotenv");
const express             = require("express");
const bodyParser          = require("body-parser");
const app                 = express();
const functions           = require("./functions.js");
const mongoose            = require("mongoose");
const _                   = require("lodash");
const favicon             = require("serve-favicon");
dotenv.config();
app.locals.listOfAllLists = [];


// jQuery Setup
let jsdom          = require("jsdom");
const { JSDOM }    = jsdom;
const { window }   = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document    = document;
app.locals.$       = jQuery = require('jquery')(window);

// Setup express app
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + "/favicon.ico"));

// DB setup (remove <> from mongdb copy/paste link; should only have password without brackets)
// Replace "test?retryWrites=true&w=majority/" with "/todolistDB" to create a db
const connectionString = "mongodb+srv://admin-jason:" + process.env.PASSWORD + "@cluster0-mbyxu.mongodb.net/toDoListDB";
mongoose.connect(connectionString, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false,
    socketTimeoutMS: 0,
});

// for production....
// mongoose.connect("mongodb://localhost:27017/todolistDB", { 
//     useNewUrlParser: true, 
//     useUnifiedTopology: true, 
//     useFindAndModify: false,
//     socketTimeoutMS: 0,
// });

//Lists will contain items
const itemSchema = {
    toDoItem: String
};
const listSchema = {
    name: String,
    items: [itemSchema]
};
const Item              = mongoose.model("Item", itemSchema); // 1st param must be singular as well as the const name
const List              = mongoose.model("List", listSchema);
const getFood           = new Item({toDoItem:"Ex: Pick up food at 5PM"});
const getIce            = new Item({toDoItem:"Ex: Drop by the bank at 11AM"});
const getMoney          = new Item({toDoItem:"<-- Click the checkbox to delete"});
var defaultItemsAdded   = false;
const defaultItems      = [getFood, getIce, getMoney];



// HOME ROUTING ---------------------------------------------------------------------------------------------
app.get("/", function(req, res) {
    let dateStr = functions.getDateTitle();
    Item.find({}, function(e, foundItems) { 
        if (e) {
            console.log(e);
        }
        // insert default items into list on first load
        else if (foundItems.length === 0 &&  !defaultItemsAdded ) {
            defaultItemsAdded  = true;            
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } 
            });
            res.render('list', {functions: functions, listTitle: dateStr, addedItems: defaultItems});
        }
        else {
            List.find({}, function (err, foundListItems) {
                if (err) {
                    console.log(err);
                }
                else if (foundListItems) {
                    res.render('list', {
                        functions: functions, 
                        listTitle: dateStr, 
                        addedItems: foundItems,
                        allListsObj: foundListItems
                    }); // pass all items found in collection
                }
                else {
                    res.render('list', {
                        functions: functions, 
                        listTitle: dateStr, 
                        addedItems: foundItems,
                        allListsObj: null
                    }); // pass all items found in collection                
                }
            });   
        }
    });
});
app.post("/", function(req, res) {
    const itemName = req.body.newListItem;
    const listName = req.body.listType;
    const dateStr = functions.getDateTitle();
    if (req.body.newListItem.length > 0) {
        let newUserItem = new Item({toDoItem: itemName});
        if (listName === dateStr) {
            newUserItem.save();
            res.redirect("/");
        }
        else {
            List.findOne({name: listName}, function(e, foundList) {
                if (e) {
                    console.log(e);
                }
                else {
                    foundList.items.push(newUserItem);
                    foundList.save();
                    res.redirect("/" + listName);
                }
            });
        }
    }
    else {
        res.redirect("/");
    }
});






// CREATE LIST ROUTING ---------------------------------------------------------------------------------------------
app.get("/create", function(req, res) {
    List.find({}, function (err, foundItems) {
        if (err) {
            console.log(err);
        }
        else if (foundItems) {
            res.render('addList', {allListsObj: foundItems});
        }
        else {
            res.render('addList', {allListsObj: null});
        }
    });
});

app.post("/create", function(req, res) {
    if (req.body.newListName.length > 0) {
        List.findOne({name: req.body.newListName}, function(e, foundList) {
            if (e) {
                console.log(e);
            }
            else if (foundList) {
                res.redirect(foundList.name);
            }
            else {            
                res.redirect(req.body.newListName);
            }
        });
    }
    else {
        res.redirect("/create");
    }
});





// DELETE PAGE ROUTING -------------------------------------------------------------------------------------
// deleting lists
app.get("/delete", function (req, res) {
    List.find({}, function (err, foundItems) {
        if (err) {
            console.log(err);
        }
        else if (foundItems) {
            res.render('deleteList', {allListsObj: foundItems});
        }
        else {
            res.render('deleteList', {allListsObj: null});
        }
    });
});
//deleting list items
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const checkedItemList = req.body.listName;
    const dateStr = functions.getDateTitle();
    // if the page is the root page
    if (checkedItemList === dateStr) {
        // delete from Item collection since the home page only has docs of only type Item
        Item.findByIdAndDelete(checkedItemId, function(e, res) {
            if (e) {
                console.log(e);
            } 
        });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({name:checkedItemList}, {$pull: {items: {_id: checkedItemId}}}, function(e, foundItems) {
            if (!e) {
                res.redirect("/" + checkedItemList);
            }
            else {
                console.log(e);
            }
        });
    }
});
//deleting full lists
app.post("/deletelist", function(req, res) {
    const checkedItemId = req.body.checkbox;
    List.findByIdAndDelete(checkedItemId, function(err, res) {
        if (err) {
            console.log(err);
        }
    });
    res.redirect("/delete");
});





// ABOUT PAGE Routing-----------------------------------------------------------------------------------------
app.get("/about", function(req, res) {
    List.find({}, function(err, foundItems) {
        if (err) {
            console.log(err);
        }
        else if (foundItems) {
            res.render('about', {allListsObj: foundItems});
        }
        else {
            res.render('about', {allListsObj: null});
        }
    });
});





// DYNAMIC ROUTING -------------------------------------------------------------------------------------
app.get("/:userInput", function(req, res) {
    const userInput = _.capitalize(req.params.userInput);
    if (userInput === "About") {
        res.render('about');
    }
    else if (userInput === "Home") {
        res.redirect("/");
    }
    else if (userInput === "Addlist") {
        res.render('addList');
    }
    else {
        // find user inputted list (directly in search bar or from nav bar)
        List.findOne({name: userInput}, function(err, foundList) {
            if (!err) {
                if (foundList) {
                    // render the page with dropdown menu updates
                    List.find({}, function (err, foundListItems) {
                        const dropDownListItem = _.startCase(_.toLower(foundList.name));
                        if (err) {
                            console.log(err);
                        }
                        else if (foundListItems) {
                            res.render('list', {
                                functions: functions, 
                                listTitle: dropDownListItem, 
                                addedItems: foundList.items,
                                allListsObj: foundListItems
                            }); // pass all items found in collection
                        }
                        else {
                            res.render('list', {
                                functions: functions, 
                                listTitle: dropDownListItem, 
                                addedItems: foundList.items,
                                allListsObj: null
                            }); // pass all items found in collection                
                        }
                    });                     
                } 
                else { // create new list
                    const newList = new List({name: userInput, items: defaultItems});
                    // update global app.locals to be able to access in all templates
                    const appLocalsList = _.startCase(_.toLower(userInput));
                    // ensure app.locals.listOfAllLists reflects lists in DB
                    if (!app.locals.listOfAllLists.includes(userInput)) {
                        app.locals.listOfAllLists.push(appLocalsList);
                    }
                    newList.save();
                    res.redirect("/" + userInput);
                }
            } 
            else {
                console.log(err);
            }
        }); // end first List.findOne
    } // end else case for created lists
});

//app.listen(3000, () => console.log("Server listening on port 3000."));
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);