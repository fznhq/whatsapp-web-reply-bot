 (function(document) {   
    var selector = {
        chat_unread:         "span > div > span[aria-label]:not(:empty)",
        chat_title:          "span[title]",
        chat_group:          "[data-icon='default-group']",

        message:             ".selectable-text",
        message_in:          ".message-in",
        message_out:         ".message-out",
        message_all:         ".message-in, .message-out",
        message_box:         "footer div[contenteditable]",
        message_data:        "[data-pre-plain-text]",
        message_ignore:      "div[role='button'], a, img, [data-icon='media-play'], [data-icon='media-gif'], [data-icon='media-download'], [data-icon='media-cancel']",
        message_tail_in:     "[data-icon='tail-in']",
        message_send_btn:    "footer span[data-icon='send']",

        new_message_info:    "div > span[aria-live]",

        user_name_group:     "span[dir='auto']",
        user_name_personal:  "span[aria-label]",

        selected_chat_title: "header span[title]"
    };
    
    var replyList = function(message, info) {
        
        if ( message == "@hello") {
            return `Hai ${info.name}`;
        }
        
        else if ( message == "@time" ) {
            return `Time ${Date()}`;
        }

    }
    
    function getContext( context ) {
        return context || document;
    }

    function find( name, context, all ) {
        var method = "querySelector";
        if ( all ) method += "All";
        return getContext(context)[method](selector[name]);
    }

    function next( element, findEl, level ) {
        while ( element && (findEl ? element !== findEl : level--) ) element = element.nextSibling;
        return element;
    }

    function parent( element, level ) {
        while ( element && level-- ) element = element.parentNode;
        return element;
    }

    function last( element ) {
        return element[element.length - 1];
    }

    function hasClass( element, name ) {
        return element.classList.contains(selector[name].slice(1));
    }

    function fireMouse( element, eventType ) {
        element && element.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
    }

    function fireEvent( element, eventType ) {
        element && element.dispatchEvent(new Event(eventType, { bubbles: true }));
    }

    function objSetter( element, $interface, property, data ) {
        Object.getOwnPropertyDescriptor($interface.prototype, property).set.call(element, data);
    }

    function repeat( fn ) {
        setTimeout(function() {
            fn() || repeat(fn);
        }, 200);
    }

    function getUnreadChat() {
        var unread = find("chat_unread");

        return unread && {
            chat: parent(unread, 6),
            span: unread,
            isGroup: !!find("chat_group", parent(unread, 6))
        };
    }

    function selectChat( element, done ) {
        if ( !element.chat ) return;

        fireMouse(element.chat, "mousedown");
        
        if ( !done ) return;
        if ( element.span ) element.span.innerHTML = "";

        var titleMain, title = find("chat_title", element.chat).title;
        
        repeat(function() {
            titleMain = find("selected_chat_title").title;
            if ( titleMain === title ) return done(), true;
        });
    }

    function isNewChat( context ) {
        return find("message_all", context, true).length === find("message_in", context, true).length;
    }

    function getUnreadMessages() {
        var messages = parent(find("message_all"), 1);
        var unreads  = [];

        if ( messages && hasClass(messages.lastElementChild, "message_in") ) {
            var newMessageInfo = parent(find("new_message_info", messages), 1);

            if ( newMessageInfo || isNewChat(messages) ) {
                var newMessageStart = next(newMessageInfo, null, 1);
                var lastMessageOut  = last(find("message_out", messages, true));
                var afterMessageOut = next(newMessageStart, lastMessageOut);
                var newMessage      = false;
                var noRepeatMessage = false;

                messages.childNodes.forEach(function( message ) {
                    if ( !newMessageStart || (!newMessage && message === newMessageStart) ) newMessage = true;
                    if ( !afterMessageOut || (!noRepeatMessage && newMessage && message === afterMessageOut) ) noRepeatMessage = true;
                    if ( newMessage && noRepeatMessage && hasClass(message, "message_in") && !find("message_ignore", message) ) unreads.push(message);
                });
            }
        }

        return unreads;
    }

    function getUserName( context ) {
        var name = find("user_name_personal", context);

        if ( name ) {
            name = name.getAttribute(selector.user_name_personal.slice(5,-1)).slice(0, -1);
        } else {
            name = find("user_name_group", context).innerText;
        }

        return name.trim();
    }

    function replayUnreadMessages( isGroup ) {
        var messages = getUnreadMessages();
        var text, name, reply;

        messages.forEach(function( message ) {
            if ( isGroup ) {
                if ( find("message_tail_in", message) ) name = getUserName(message);
            } else {
                name = getUserName(message);
            }

            text = find("message", message).innerText.trim();
            reply = replyList(text, { name: name });

            if ( reply ) sendMessage(reply);
        });
    }

    function sendMessage( message ) {
        var box = find("message_box");
        objSetter(box, Element, "innerHTML", message);
        fireEvent(box, "input");
        fireEvent(box, "focus");
        var btn = parent(find("message_send_btn"), 1);
        fireMouse(btn, "click");
    }

    function unfocusPage() {
        fireEvent(getContext().documentElement, "blur");
    }

    function startReplayBot() {
        unfocusPage();
        var unreadChat = getUnreadChat();

        if ( unreadChat ) {
            selectChat(unreadChat, function() {
                replayUnreadMessages(unreadChat.isGroup);
                unfocusPage();
                repeat(startReplayBot);
            });
        } else {
            repeat(startReplayBot);
        }

        return true;
    }
    
    startReplayBot();
})(document);