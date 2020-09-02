const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

// tell app to use body parser
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

mongoose.connect(process.env.CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemsSchema = {
    name: {
        type: String,
        required: true
    }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Buy Food!"
});

const item3 = new Item({
    name: "Eat Food!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// home route
app.get("/", (req, res) => {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added!");
                }
            });

            // Call this again
            res.redirect("/");

        } else {
            res.render("list", {
                listTitle: "Today",
                newListItem: foundItems
            });
        }
    })

});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/:customListName", (req, res) => {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (err) {
            console.log(err);
        } else {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                setTimeout(() => {
                    res.redirect("/" + customListName);
                }, 2000);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        }
    });

});

// app.get("/work", (req, res) => {
//     res.render("list", {
//         listTitle: "Work List",
//         newListItem: workItems
//     });
// });

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({
            _id: checkedItemId
        }, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted successfully!");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(err){
                console.log(err);
            } else {
                res.redirect("/" + listName);
            }
        })
    }

});

// get nextItem from the html form through post method
app.post("/", (req, res) => {
    const itemName = req.body.nextItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}
// listening to port 3000
app.listen(port, () => {
    console.log("Server started!");
});