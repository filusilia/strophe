//接收消息
function onMessage(msg) {
    var to = msg.getAttribute('to'),
        from = msg.getAttribute('from'),
        type = msg.getAttribute('type'),
        elems = msg.getElementsByTagName('body'),
        nick = msg.getElementsByTagName('nick') || from,
        resource = Strophe.getResourceFromJid(from),//library
        stamp = $(msg).children("delay").attr('stamp');
    stamp ? stamp = temp.getFullYear() + '-' + (temp.getMonth() + 1) + '-' + temp.getDate() + '/' + temp.getHours() + ':' + temp.getMinutes() + ':' + temp.getSeconds() : stamp = '';

    console.log(nick, 'nick', 'stamp', stamp);
    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        log(new Date().toLocaleTimeString() + ' ' + nick + ': ' + stamp + Strophe.getText(body));
    } else {
        console.log('onMessage', msg);
    }
    return true;
}

//发送消息
function sendMessage(from, to, msg) {
    var reply = $msg({
        to: to + '@' + session.domain,
        from: from, type: 'chat'
    }).cnode(Strophe.xmlElement('body', '', msg));
    connection.send(reply.tree());
}

//发送群聊（待测试
function sendGroupMessage(from, to, msg) {
    $msg({
        to: to + '@' + session.domain,
        from: from, type: 'groupchat'
    })
        .cnode(Strophe.copyElement(msg));
}

function rawInput(data) {
    log(formatXml(data), false);
}
function rawOutput(data) {
    log(formatXml(data), true);
}

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function (index, node) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    var xml_escaped = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').replace(/\n/g, '');
    return xml_escaped;
}