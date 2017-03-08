/**
 *
 * @type {string}
 */
//!!!重要 请求方法进行发送from与to时，注意id是否需要包含domain（服务器地址）
var BOSH_SERVICE = 'http://127.0.0.1:7070/http-bind/';
var connection = null;
//定义domain
var session = {
    user: 'alice',
    domain: '127.0.0.1',
    resource: ''
};
var jid = session.user + '@' + session.domain;

function log(msg, sent) {
    if (sent) {
        $('#log').prepend("<pre>" + msg + "</pre>");
        $('#log').prepend("<span style='color: green;background-color: white;'>SENT</span>:\n");
    } else {
        $('#log').prepend("<pre>" + msg + "</pre>");
        $('#log').prepend("<span style='color: orangered;background-color: white;'>RECV</span>:\n");
    }
}

function onConnect(status) {

    console.log('Strophe.Status.CONNECTING: ' + Strophe.Status.CONNECTING);
    console.log('Strophe.Status.CONNFAIL: ' + Strophe.Status.CONNFAIL);
    console.log('Strophe.Status.DISCONNECTING: ' + Strophe.Status.DISCONNECTING);
    console.log('Strophe.Status.DISCONNECTED: ' + Strophe.Status.DISCONNECTED);
    console.log('Strophe.Status.CONNECTED: ' + Strophe.Status.CONNECTED);
    console.log('Strophe.Status.AUTHENTICATING: ' + Strophe.Status.AUTHENTICATING);
    console.log('Strophe.Status.AUTHFAIL: ' + Strophe.Status.AUTHFAIL);
    console.log('=============================');
    console.log(connection);
    console.log(status);

    if (status == Strophe.Status.CONNECTING) {
        console.log('正在连接...');
        console.log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
        console.log('Strophe failed to connect.');
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
        console.log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
        console.log('Strophe is disconnected.');
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
        console.log('连接成功！');
        connection.addHandler(onMessage, null, 'message', null, null, null);

        connection.addHandler(onPresence, 'jabber:client', 'presence', null, null, null);
        //好友相关路由器
        connection.addHandler(onSubscribe, 'jabber:client', 'presence', 'subscribe', null, null);
        connection.addHandler(onUnsubscribe, 'jabber:client', 'presence', 'unsubscribe', null, null);

        //好友更新请求监听
        connection.addHandler(onIq, null, 'iq', null, null, null);
        // connection.addHandler(get_roster, 'jabber:iq:roster', 'iq', 'set', null, null);
        console.log('login——》');
        //获取好友列表
        //未上线时获取好友列表，登录时会进行推送好友状态，可以直接更新好友的在线状态
        get_roster();
        //上线
        online();

    }
}
$(document).ready(function () {

    connection = new Strophe.Connection(BOSH_SERVICE);
    // 注册事件处理器
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;
    connection.connect("alice@127.0.0.1", "123456", onConnect);
    // 按钮事件
    $('#connect').bind('click', function () {
        var button = $('#connect').get(0);
        if (button.value == 'connect') {
            button.value = 'disconnect';
            // 连接:
            connection.connect(
                $('#jid').get(0).value, // Jabber 标识 (用户名 Full JID)
                $('#pass').get(0).value,// 密码
                onConnect
            );
        } else {
            button.value = 'connect';
            connection.disconnect();
        }
    });
    $('#query').bind('click', function () {
        query(connection, 'info', '127.0.0.1', 'config');
    });
    $('#getlast').bind('click', function () {
        // get_last();
        get_roster();
    });

    $('#online').bind('click', function () {
        var button = $('#online').get(0);
        if (button.value == 'online') {
            button.value = 'offline';
            online();
        } else {
            button.value = 'online';
            offline();
        }
    });
    $('#clear').bind('click', function () {
        $('#log').html('');
    });

    $('#accept').bind('click', function () {
        subscribe('subscribed', 'aoz@127.0.0.1');
    });

    $('#send').bind('click', function () {
        sendMessage(jid, $('#msslaber').html(), $('#mss').val());
    });
    $('#addf').bind('click', function () {
        subscribe('subscribe', $('#addtext').val());
    })
});

//监听pres标签
function onPresence(pres) {
    var fromJid = $(pres).attr("from"),
        fromBareJid = Strophe.getBareJidFromJid(fromJid),
        from = Strophe.getNodeFromJid(fromJid),
        myBareJid = Strophe.getBareJidFromJid(connection.jid),
        type = $(pres).attr("type"),
        show = $(pres).children("show").text(),
        priority = $(pres).children("priority").text(),
        statusMsg = $(pres).children("status").text(),
        contactDropDown = $('#to-jid'),
        line;
    console.log("presence", fromJid, type, show, priority, statusMsg);
    switch (type) {
        case 'unavailable'://有好友下线
            console.log(from + ' 下线了');
            $('#friendlist').find('.' + from).find('span').css('color', '#000');
            break;
        case 'error'://发生错误
            console.log(from + ' 产生了error');
            break;
        default :
            break
    }
    if (priority) {
        console.log(from + ' 在线');
        $('#friendlist').find('.' + from).find('span').css('color', '#0f0');
    }
    // $.each(roster, function (index, rosterEntry) {
    //     if (rosterEntry.jid === fromBareJid) {
    //         if (type === "unavailable") {
    //             rosterEntry.presence = "offline";
    //             rosterEntry.message = null;
    //         } else {
    //             if (show) {
    //                 rosterEntry.presence = show;
    //             } else {
    //                 rosterEntry.presence = 'online';
    //             }
    //             if (statusMsg) {
    //                 rosterEntry.message = statusMsg;
    //             } else {
    //                 rosterEntry.message = null;
    //             }
    //         }
    //     }
    // });
    //!!!!重要 return true;
    return true;
}


//监听iq标签
function onIq(iqmsg) {
    var fromJid = $(iqmsg).attr("from"),
        fromBareJid = Strophe.getBareJidFromJid(fromJid),
        myBareJid = Strophe.getBareJidFromJid(connection.jid),
        type = $(iqmsg).attr("type"),
        show = $(iqmsg).children("show").text(),
        statusMsg = $(iqmsg).children("status").text(),
        contactDropDown = $('#to-jid'),
        line;
    console.log(iqmsg);
    switch (type) {
        case 'set':
            console.log('iq set type:' + fromJid);
            break;
            break;
        default :
            console.log(type, 'on iq');
            break
    }
    //!!!!重要 return true;
    return true;
}

function getId() {
    var t = new Date().getTime();
    return 'id-' + t;
}

var query = function query(connection, type, to, node) {
    var stanza = $iq({
        type: 'get',
        id: getId(),
        to: to || session.domain,
        from: jid
    });
    var query_attributes = {
        xmlns: 'http://jabber.org/protocol/disco#' + type
    };
    if (node) {
        query_attributes.node = node;
    }
    stanza.c('query', query_attributes);
    connection.send(stanza.tree());
};
var query_info = function () {
    var stanza = $iq({
        type: 'get',
        id: getId(),
        to: session.domain,
        from: jid
    }).c('query', {xmlns: 'http://jabber.org/protocol/disco#info'});
    connection.send(stanza.tree());
};
var query_items = function () {
    var stanza = $iq({
        type: 'get',
        id: getId(),
        to: session.domain,
        from: jid
    }).c('query', {xmlns: 'http://jabber.org/protocol/disco#items'});
    connection.send(stanza.tree());
};

var get_cputime = function () {
    var stanza = $iq({
        type: 'get',
        id: getId(),
        to: session.domain,
        from: jid
    }).c('query', {xmlns: 'ejabberd:cputime'});
    connection.send(stanza.tree());
};

var query_protocal = function (name) {
    var stanza = $iq({
        from: jid,
        to: 'hezhiqiang@xmpp.hezhiqiang.info',
        id: connect.getUniqueId(),
        type: 'set'
    }).c('query', {xmlns: 'http://jabber.org/protocal/bytestreams', sid: 'dv917fb4', mode: 'tcp'})
        .c('streamhost', {jid: jid, host: '192.168.8.104', port: ''});
    connection.send(stanza.tree());
};

var get_room_members = function () {
    var stanza = $iq({
        type: 'get',
        from: jid,
        to: session.domain
    }).c('query', {xmlns: 'http://jabber.org/protocol/muc#member-list'});
    connection.send(stanza.tree());
};

var get_commands = function (connection) {
    var stanza = $iq({
        type: 'get',
        to: session.domain,
        from: jid,
        id: getId()
    }).c('query', {xmlns: 'http://jabber.org/protocol/disco#info', node: 'http://jabber.org/protocol/commands'});
    connection.send(stanza.tree());
};


var get_version = function () {
    var iq = $iq({
        type: 'get',
//    id: getId(),
        to: session.domain
//    from: session.user + '@' + session.domain
    }).c('query', {xmlns: 'jabber:iq:version'});
    connection.send(iq.tree());
};

var exec_command = function (node, action) {
    var iq = $iq({
        type: 'set',
        id: getId(),
        to: session.domain,
        from: jid
    }).c('command', {xmlns: 'http://jabber.org/protocol/commands', node: node, action: action});
    connection.send(iq.tree());
};

var get_last = function () {
    var iq = $iq({
        type: 'get',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:last'});
    connection.send(iq.tree());
};

var get_server_command_list = function () {
    var iq = $iq({
        type: 'get',
        from: jid,
        to: session.domain
    }).c('query', {xmlns: 'http://jabber.org/protocol/disco#items', node: 'http://jabber.org/protocol/commands'});
    connection.send(iq.tree());
};

var get_node = function (node) {
    var iq = $iq({
        type: 'get',
        from: jid,
        to: session.domain
    }).c('query', {xmlns: 'http://jabber.org/protocol/disco#items', node: node});
    connection.send(iq.tree());
};

var admin_get_user_statistics = function () {
    var iq = $iq({
        type: 'get',
        id: getId(),
        to: session.domain,
        from: jid
    }).c('command', {
        xmlns: 'http://jabber.org/protocol/commands',
        action: 'execute',
        node: 'http://jabber.org/protocol/admin#user-stats'
    });
    connection.send(iq.tree());
};


// 在线状态
var online = function () {
    var elementShow = Strophe.xmlElement('show', {}, 'chat');
    var elementStatus = Strophe.xmlElement('status', {}, '在线');
    var presence = $pres({
        from: jid,
        xmlns: 'jabber:client',
        'xmlns:stream': 'http://etherx.jabber.org/streams',
        version: '1.0'
    })
        .cnode(elementShow).up()
        .cnode(elementStatus);
    connection.send(presence.tree());
};
var offline = function () {
    connection.send($pres({from: jid, type: 'unavailable'}).tree());
};
var away = function () {
    var elementShow = Strophe.xmlElement('show', {}, 'away');
    var elementStatus = Strophe.xmlElement('status', {}, 'away');
    var presense = $pres({from: jid})
        .cnode(elementShow).up()
        .cnode(elementStatus);
    connection.send(presense.tree());
};
var xa = function () {
    var elementShow = Strophe.xmlElement('show', {}, 'xa');
    var elementStatus = Strophe.xmlElement('status', {}, '离开');
    var presense = $pres({from: jid})
        .cnode(elementShow).up()
        .cnode(elementStatus);
    connection.send(presense.tree());
};
var busy = function () {
    var elementShow = Strophe.xmlElement('show', {}, 'dnd');
    var elementStatus = Strophe.xmlElement('status', {}, '繁忙');
    var presense = $pres({from: jid})
        .cnode(elementShow).up()
        .cnode(elementStatus);
    connection.send(presense.tree());
};

var changeOnlineStatus = function (show, status) {
    switch (show) {
        case 'chat':
            online();
            break;
        case 'away':
            away();
            break;
        case 'xa':
            xa();
            break;
        case 'dnd':
            busy();
            break;
    }
};

var CHAT_STATUS = {
    ACTIVE: 'active',
    COMPOSING: 'composing',
    GONE: 'gone',
    INACTIVE: 'inactive',
    PAUSED: 'paused'
};
var Chat = {
    changeStatus: function (status, to) {
        var msg = $msg({
            from: jid,
            to: to,
            type: 'chat',
            xmlns: 'jabber:client',
            'xmlns:stream': 'http://etherx.jabber.org/streams',
            version: '1.0'
        })
            .c(status, {xmlns: 'http://jabber.org/protocol/chatstates'});
        connection.send(msg.tree());
    }
};