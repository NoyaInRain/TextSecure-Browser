(function() {
"use strict";

window.whisperweb = window.whisperweb || {};

/* WhisperWeb */

whisperweb.WhisperWeb = function() {
    this.el = document.body;
}

whisperweb.WhisperWeb.prototype = {
    start: function() {
        // TODO: use some routing component
        var page = null;
        if (textsecure.storage.getUnencrypted("number_id")) {
            page = new whisperweb.MainPage();
        } else {
            page = new whisperweb.SignInPage();
        }
        this.el.appendChild(page.render().el);
    }
}

/* MainPage */

whisperweb.MainPage = Backbone.View.extend({
    tagName: "div",
    className: "main-page page",

    events: {
        "click .main-page-start-conversation": "startConversationClicked"
    },

    initialize: function() {
        this.panels = [];
    },

    template: function(id) {
        var template = document.querySelector("." + id + "-template");
        return document.importNode(template.content, true);
    },

    render: function() {
        this.el.appendChild(this.template("main-page"));
        this._conversationListView =
            new Whisper.ConversationListView({collection: inbox});
        this.el.querySelector(".main-page-conversations").replaceChild(
            this._conversationListView.render().el,
            this.el.querySelector(".main-page-conversation-list"));

        // TODO: remove
        var div = document.createElement("div");
        div.classList.add("conversation");
        this.el.appendChild(div);

        return this;
    },

    startConversationClicked: function() {
        var panel = new Whisper.NewConversationView();
        panel.el.classList.add("panel");
        this.el.appendChild(panel.render().el);
        this.panels.push(panel);
    }
});

window.document.addEventListener("DOMContentLoaded", function() {
    var request = new XMLHttpRequest();
    request.open("GET", "index.html", true);
    request.onload = function() {
        var templates = request.responseXML.querySelectorAll('script[type="text/x-tmpl-mustache"]');
        for (var template of templates) {
            //console.log(template);
            document.body.appendChild(template);
        }
        window.app = new whisperweb.WhisperWeb();
        app.start();
    };
    request.send();
});

/* SignInPage */

whisperweb.SignInPage = function() {
    this.el = document.createElement("div");
    this.el.classList.add(this.className);
    this._number = null;
}

whisperweb.SignInPage.prototype = Object.create(Object.prototype, {
    className: {value: "sign-in-page"},

    render: {value: function() {
        var template = document.querySelector(".sign-in-page-template");
        this.el.appendChild(document.importNode(template.content, true));
        this.el.querySelector(".sign-in-page-sign-in")
            .addEventListener("submit", this._signInSubmitted.bind(this));
        this.el.querySelector(".sign-in-page-sign-in-2")
            .addEventListener("submit", this._signIn2Submitted.bind(this));
        return this;
    }},

    _signInSubmitted: {value: function(event) {
        event.preventDefault();
        this._number = this.el.querySelector(".sign-in-page-sign-in [name='number']").value;
        console.log(this._number);
        // TODO: document this call
        //Promise.resolve(true).then(function(result) {
        textsecure.api.requestVerificationSMS(this._number).then(function(result) {
            console.log(result);
            this.el.querySelector(".sign-in-page-step-1").style.display =
                "none";
            this.el.querySelector(".sign-in-page-step-2").style.display =
                "block";
        }.bind(this), function(reason) {
            // TODO: if number has wrong format 400 error with incorrect message
            console.log("CATCHING ERROR");
            console.log(reason);
        });
    }},

    _signIn2Submitted: {value: function(event) {
        event.preventDefault();
        var verification = this.el.querySelector(".sign-in-page-sign-in-2 [name='verification']").value;
        console.log("register device");
        textsecure.registerSingleDevice(this._number, verification,
            function(step) {
                console.log("step nr " + step);
            }
        ).then(function() {
            console.log("TODO: show conversation list");
        }, function(error) {
            console.log("ERROR");
            if (error.message === "403") {
                document.querySelector(".notification").textContent = "Invalid code, please try again";
            } else {
                console.log("2 CATHING ERROR");
                console.log(error);
            }
        });
    }}
});

}());
