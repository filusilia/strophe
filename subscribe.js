/**
 * Created by alice on 2017/3/3 0003
 */

// Strophe.getUserFromJid("alice@127.0.0.1/library");//darcy
// Strophe.getDomainFromJid("alice@127.0.0.1/library");//127.0.0.1
// Strophe.getResourceFromJid("alice@127.0.0.1/library");//library
// Strophe.getBareJidFromJid("alice@127.0.0.1/library");//alice@127.0.0.1

//监听订阅的handler
function onSubscribe(pres) {
    var fromJid = $(pres).attr("from"),//添加者
        from = Strophe.getNodeFromJid(fromJid),
        fromBareJid = Strophe.getBareJidFromJid(fromJid),
        myBareJid = Strophe.getBareJidFromJid(connection.jid),
        statusMsg = $(pres).children("status").text();
    console.log('someone subscribe you! he is:' + from);
    $('#addlist').append('<li><span>好友请求：' + from + '</span><a href="javascript:accept(\'' + from + '\');">同意</a></li>');
    //!!!!重要 return true;
    return true;
}
//同意好友请求，进行两步操作（同意订阅与订阅对方
function accept(from) {
    subscribe('subscribed', from);
    //添加到好友列表中
    $('#friendlist').append('<li class="' + from + '"><span>' + from + '</span><a href="javascript:talkto(\'' + from + '\')">talk</a></li>');
    //订阅对方
    subscribe('subscribe', from);
    // $('#addlist').find('.'+from).empty();
}

//提交订阅请求（添加好友subscribe，同意好友请求subscribed，拒绝好友请求unsubscribed）
var subscribe = function (type, to) {
    connection.send($pres({
        type: type,
        from: jid,
        to: to + '@' + session.domain,
        xmlns: 'jabber:client',
        'xmlns:stream': 'http://etherx.jabber.org/streams'
    }).tree());
};

function onUnsubscribe(pres) {
    var fromJid = $(pres).attr("from"),//添加者
        fromBareJid = Strophe.getBareJidFromJid(fromJid),
        myBareJid = Strophe.getBareJidFromJid(connection.jid),
        statusMsg = $(pres).children("status").text(),
        from = Strophe.getNodeFromJid(jid);
    console.log('someone unsubscribed you! he is:' + fromJid);
    //好友取消订阅，同时发送给好友取消订阅
    subscribe('unsubscribed', from);
    $("#friendlist").find('.' + from).empty();
    //!!!!重要 return true;
    return true;
}

// 获取好友列表，获取好友列表并不会更新好友的在线状态
var get_roster = function () {
    var iq = $iq({
        type: 'get',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'});
    connection.send(iq.tree());

    var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
    connection.sendIQ(iq, getFriends); // getFriends是回调函数
};
function getFriends(iq) {
    $('#friendlist').html('');
    $(iq).find('item').each(function () {
        var jid = $(this).attr('jid');
        var name = $(this).attr('name') || jid;
        var from = Strophe.getNodeFromJid(jid);
        $('#friendlist').append('<li class="' + from + '"><span>' + name + '</span><a href="javascript:talkto(\'' + from + '\')">talk</a></li>');
        console.log(jid + ' - ' + name);
    });
}

function talkto(from) {
    console.log(from);
    $('#msslaber').html(from);
}

// 删除好友
var remove_contact = function (name) {
    var iq = $iq({
        type: 'set',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {
        jid: name + '@' + session.domain,
        subscription: 'remove'
    });
    connection.send(iq.tree());
};
// 添加好友
var add_contact = function (name) {
    var iq = $iq({
        type: 'set',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {jid: name + '@' + session.domain, name: '名字' + name});
    connection.send(iq.tree());
};
// 更新好友信息
var update_contact1 = function (name) {
    var iq = $iq({
        type: 'set',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {jid: name + '@' + session.domain, name: '名字' + name});
    connection.send(iq.tree());
};
// 更新好友分组
var update_contact2 = function (name) {
    var iq = $iq({
        type: 'set',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {
        jid: name + '@' + session.domain,
        name: '名字' + name
    }).c('group').t('myFriends');
    connection.send(iq.tree());
};

// 更新联系人信息,如果传递了组,同时更新组信息
var set_contact = function (name, group) {
    var iq = $iq({
        type: 'set',
        id: getId()
    }).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {jid: name + '@' + session.domain, name: '名字' + name});
    if (group !== undefined) {
        iq.c('group').t(group);
    }
    connection.send(iq.tree());
};