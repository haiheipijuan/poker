'use strict';

var game = null
var gParam = {ws_server:"172.24.222.54:8989", user_name:"", platform:"PC"}

function startGame(gameParam) {
   
    try {
    // merge property
    for(var p in gParam) {
       var value = gameParam[p];
        if(value != undefined && value != null) {
            gParam[p] = gameParam[p];
        }
    }
    
    game = new Phaser.Game("100", "100", Phaser.CANVAS, "gamediv");
    
    game.betApi = new BetApi();
    
    game.betApi = new BetApi();

    game.state.add("LoginState", LoginState);
    game.state.add("MainState", MainState);
    game.state.start("LoginState");
        
    } catch(e) {
        console.log("error ! ", e);
    }
}

var strVersion = "1.0";
var userName = "cmdTest";
var userID = "";
var loginCertification = false;

function getCookie(name)
{
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");

    if(arr = document.cookie.match(reg))
        return (arr[2]);
    else
        return null;
}

function setCookie(name, value)
{
    var Days = 30;
    var exp = new Date();
    exp.setTime(exp.getTime() + Days*24*60*60*1000);
    var str = name + "="+ escape (value) + "; expires=" + exp.toGMTString();
    document.cookie = str;
}

var callbackOpen = function(data)
{
    console.log("callbackOpen " + data);

    game.betApi.checkVersion(strVersion, function(isOK){
        console.log("checkVersion " + isOK);
    });
};

var callbackClose = function(data)
{
    console.log("callbackClose " + data);
    loginCertification = false;

    game.state.states["MainState"]._disconnectReset();
};

var callbackMessage = function(data)
{
    console.log("callbackMessage " + data);
    if(data.version && data.version == strVersion) // checkVersion result
    {
        game.state.states["LoginState"].initUserName();
    }
    else if(!loginCertification) // loginCertification result
    {
        if(data.id)
        {
            userID = data.id;
            game.betApi.setUserID(userID);
            loginCertification = true;

            var LoginState = game.state.states["LoginState"];
            LoginState.hanldeInitUserName();
        }
    }
    else if(data.type == "iq")
    {
        if(data.class == "room")       //查询游戏房间列表
        {
            game.state.states["LoginState"].handleCreateRoom(data);
        }
        else if(data.class == "roomlist")       //查询游戏房间列表
        {
            game.state.states["LoginState"].handleGetRoomList(data);
        }
        else if(data.class == "room")  //查询游戏房间信息
        {

        }
        else if(data.class == "occupant")  //查询玩家信息
        {

        }
    }
    else if(data.type == "message")
    {
    }
    else if(data.type == "presence")
    {
        if(data.action == "active")         //服务器广播进入房间的玩家
        {
        }
        else if(data.action == "gone")      //服务器广播离开房间的玩家
        {
            game.state.states["MainState"].handleGone(data);
        }
        else if(data.action == "join")      //服务器通报加入游戏的玩家
        {
            game.state.states["MainState"].handleJoin(data);
        }
        else if(data.action == "button")    //服务器通报本局庄家
        {
            game.state.states["MainState"].handleButton(data);
        }
        else if(data.action == "preflop")   //服务器通报发牌
        {
            game.state.states["MainState"].handlePreflop(data);
        }
        else if(data.action == "flop")   //发牌
        {
            game.state.states["MainState"].handleFlop(data);
        }
        else if(data.action == "turn")   //发牌
        {
            game.state.states["MainState"].handleTurn(data);
        }
        else if(data.action == "river")   //发牌
        {
            game.state.states["MainState"].handleRiver(data);
        }
        else if(data.action == "pot")       //服务器通报奖池
        {
            game.state.states["MainState"].handlePot(data);
        }
        else if(data.action == "action")    //服务器通报当前下注玩家
        {
            game.state.states["MainState"].handleAction(data);

        }
        else if(data.action == "bet")       //服务器通报玩家下注结果
        {
            game.state.states["MainState"].handleBet(data);

        }
        else if(data.action == "showdown")  //服务器通报摊牌和比牌
        {
            game.state.states["MainState"].handleShowDown(data);
        }
        else if(data.action == "state")  //服务器通报房间信息
        {
            game.state.states["MainState"].handleState(data);
        }
    }
};

var callbackError = function(data)
{
    console.log("callbackError" + data);
};

var LoginState = function() {

    this.scale;                         //全局缩放比
    this.group;
    this.currentPage = 0;
    this.CountPerPage = 10;
    this.currentSelectRoomID = -1;
    this.roomInfoList;

    this.roomList;
    this.roomTextList;
    this.btnPrev;
    this.btnNext;
    this.leName;
    this.leRoomName;
    this.leChangeName;
    this.btnChangeName;
    this.btnLogin;
    this.btnCreate;

    this.textPrev;
    this.tectNext;
    this.textLogin;
    this.tectCreate;
};

LoginState.prototype = {

    preload: function () {
        game.load.image("gamecenterbackground", "assets/background.png");
        game.load.image('buttonblue', 'assets/btn-blue.png');
        game.load.image('buttongrey', 'assets/btn-grey.png');
        game.load.image('buttonyellow', 'assets/btn-yellow.png');
    },

    create: function () {

        game.betApi.connect();
        game.betApi.registerCallback(callbackOpen, callbackClose, callbackMessage, callbackError);

        var imageBK = game.add.image(0, 0, "gamecenterbackground");
        imageBK.visible = false;
        var xScale = game.width / imageBK.width;
        var yScale = game.height / imageBK.height;
        this.scale = xScale < yScale ? xScale : yScale;
        loginCertification = false;

        this.roomInfoList = [];
        this.roomList = [];
        this.roomTextList = [];
        this.group = game.add.group();
        var listWidth = game.width / 2;
        var listItemHeight = game.height / 12;
        var style = { font: "16px Arial", fill: "#0069B2", wordWrapWidth: listWidth * 0.9, align: "left"};
        for(var i = 0; i < 10; i++)
        {
            var listItem = game.add.button(0, i * listItemHeight, 'buttonblue', this.selectRoom);
            listItem.width = listWidth;
            listItem.height = listItemHeight;
            listItem.roomID = "";
            listItem.visible = false;
            this.roomList.push(listItem);
            var roomInfo = game.add.text(listItem.x + 0.05 * listItem.width, listItem.y + 0.45 * listItem.height, "", style);
            roomInfo.scale.setTo(this.scale);
            roomInfo.anchor.set(0, 0.5);
            roomInfo.visible = false;
            this.roomTextList.push(roomInfo);
            this.group.add(listItem);
            this.group.add(roomInfo);
        }

        this.btnPrev = game.add.button(0, 10 * listItemHeight, 'buttonyellow', this.clickPrev, this);
        this.btnPrev.width = listWidth / 2;
        this.btnPrev.height = listItemHeight;
        this.btnNext = game.add.button(listWidth / 2, 10 * listItemHeight, 'buttonyellow', this.clickNext, this);
        this.btnNext.width = listWidth / 2;
        this.btnNext.height = listItemHeight;
        style = { font: "28px Arial", fill: "#CE8D00"};
        this.textPrev = game.add.text(this.btnPrev.x + 0.5 * this.btnPrev.width, this.btnPrev.y + 0.5 * this.btnPrev.height, "上一页", style);
        this.textPrev.anchor.set(0.5);
        this.textPrev.scale.setTo(this.scale);
        this.tectNext = game.add.text(this.btnNext.x + 0.5 * this.btnNext.width, this.btnNext.y + 0.5 * this.btnNext.height, "下一页", style);
        this.tectNext.anchor.set(0.5);
        this.tectNext.scale.setTo(this.scale);
        this.group.add(this.btnPrev);
        this.group.add(this.btnNext);
        this.group.add(this.textPrev);
        this.group.add(this.tectNext);

        this.leName = game.add.text(listWidth * 1.2, game.height * 0.1, "用户名: " + userName, style);
        this.leName.scale.setTo(this.scale);
        this.leRoomName = game.add.text(listWidth * 1.2, game.height * 0.3, "房间名: ", style);
        this.leRoomName.scale.setTo(this.scale);
        this.group.add(this.leName);
        this.group.add(this.leRoomName);

        this.btnChangeName = game.add.button(listWidth * 1.2, game.height * 0.2, 'buttonyellow', this.clickRename, this);
        this.btnChangeName.width = listWidth / 2;
        this.btnChangeName.height = listItemHeight;
        this.leChangeName = game.add.text(this.btnChangeName.x + this.btnChangeName.width / 2, this.btnChangeName.y + this.btnChangeName.height / 2, "重命名", style);
        this.leChangeName.anchor.setTo(0.5);
        this.leChangeName.scale.setTo(this.scale);
        this.group.add(this.btnChangeName);
        this.group.add(this.leChangeName);

        this.btnLogin = game.add.button(listWidth * 1.2, game.height * 0.4, 'buttonyellow', this.clickLogin, this);
        this.btnLogin.width = listWidth / 2;
        this.btnLogin.height = listItemHeight;
        this.btnCreate = game.add.button(listWidth * 1.2, game.height * 0.5, 'buttonyellow', this.clickCreate, this);
        this.btnCreate.width = listWidth / 2;
        this.btnCreate.height = listItemHeight;
        this.textLogin = game.add.text(this.btnLogin.x + 0.5 * this.btnLogin.width, this.btnLogin.y + 0.5 * this.btnLogin.height, "进入房间", style);
        this.textLogin.anchor.set(0.5);
        this.textLogin.scale.setTo(this.scale);
        this.tectCreate = game.add.text(this.btnCreate.x + 0.5 * this.btnCreate.width, this.btnCreate.y + 0.5 * this.btnCreate.height, "建立房间", style);
        this.tectCreate.anchor.set(0.5);
        this.tectCreate.scale.setTo(this.scale);
        this.group.add(this.btnLogin);
        this.group.add(this.btnCreate);
        this.group.add(this.textLogin);
        this.group.add(this.tectCreate);
        this.group.visible = false;
    },

    initUserName:function()
    {
        var name = ""
        
        if (gParam.user_name != null && gParam.user_name != "") {
            name = gParam.user_name;
        } else {
            name = getCookie("name");
        }
        
        if(!name || name.length == 0)
        {
            name = prompt("请输入您的名字","");
        }
        if(name)
        {
            userName = name;
            setCookie("name", userName);
            game.betApi.loginCertification(userName, function(isOK){
                console.log("loginCertification is " +  isOK);
                if(!isOK)
                {
                    userName = "";
                }
            });
        }
        else
        {
            this.initUserName();
        }
    },

    hanldeInitUserName:function()
    {
        var text = "用户名: " + userName;
        this.leName.setText(text);
        this.group.visible = true;
        game.betApi.getRoomList();
    },

    handleCreateRoom:function(data)
    {
        this.currentSelectRoomID = data.room.id;
        this.clickLogin();
    },

    handleGetRoomList:function(data)
    {
        this.roomInfoList = data.rooms;
        if(!this.roomInfoList)
        {
            this.roomInfoList = [];
        }

        while(this.CountPerPage * this.currentPage > this.roomInfoList.length)
        {
            this.currentPage--;
        }

        for(var i = 0; i < this.CountPerPage; i++)
        {
            if(i + this.CountPerPage * this.currentPage < this.roomInfoList.length)
            {
                this.roomList[i].visible = true;
                this.roomTextList[i].visible = true;
                var index = i + this.CountPerPage * this.currentPage;
                this.roomList[i].roomID = this.roomInfoList[index].id;
                var strTitle = "房间ID: " + this.roomInfoList[index].id + "\n小盲注: " + this.roomInfoList[index].sb + "; 大盲注: " + this.roomInfoList[index].bb + "; 当前人数: " + this.roomInfoList[index].n + "; 最大人数: " + this.roomInfoList[index].max;
                this.roomTextList[i].setText(strTitle);
            }
            else
            {
                this.roomList[i].visible = false;
                this.roomTextList[i].visible = false;
            }
        }
    },

    selectRoom:function()
    {
        var text = "房间名: " + this.roomID;
        game.state.states["LoginState"].leRoomName.setText(text);
        game.state.states["LoginState"].currentSelectRoomID = this.roomID;
    },

    clickPrev:function()
    {
        if(this.currentPage == 0)
        {
            return;
        }

        this.currentPage--;
        game.betApi.getRoomList();
    },

    clickNext:function()
    {
        this.currentPage++;
        game.betApi.getRoomList();
    },

    clickRename:function()
    {
        setCookie("name", "");
        location.reload();
    },

    clickLogin:function()
    {
        if(this.currentSelectRoomID < 0)
        {
            alert("请选择一个房间!");
            return;
        }

        game.betApi.setRoomID(this.currentSelectRoomID);
        game.state.start("MainState");
    },

    clickCreate:function()
    {
        game.betApi.createRoom("", 5, 10, 30, 9);
    }
};

// game main state
var MainState = function() {

    this.strVersion = "1.0";
    this.CONST = {}

    //弃牌
    this.CONST.BetType_Fold = 0;
    //让牌/看注
    this.CONST.BetType_Check = 1;
    //跟注
    this.CONST.BetType_Call = 2;
    //加注
    this.CONST.BetType_Raise = 3;
    //全压
    this.CONST.BetType_ALL = 4;

    this.CONST.BetTypeNames= ["fold", "check", "call", "raise", "allin"]


    //10 - 皇家同花顺(Royal Flush)
    //9  - 同花顺(Straight Flush)
    //8  - 四条(Four of a Kind)
    //7  - 葫芦(Fullhouse)
    //6  - 同花(Flush)
    //5  - 顺子(Straight)
    //4  - 三条(Three of a kind)
    //3  - 两对(Two Pairs)
    //2  - 一对(One Pair)
    //1  - 高牌(High Card)
    this.CONST.CardType_RoyalFlush = 10;
    this.CONST.CardType_StraightFlush = 9;
    this.CONST.CardType_FourOfAKind = 8;
    this.CONST.CardType_Fullhouse = 7;
    this.CONST.CardType_Flush = 6;
    this.CONST.CardType_Straight = 5;
    this.CONST.CardType_ThreeOfAKind = 4;
    this.CONST.CardType_TwoPairs = 3;
    this.CONST.CardType_OnePairs = 2;
    this.CONST.CardType_HighCard = 1;

    this.CONST.CardTypeNames= ["", "高牌", "一对", "两对", "三条", "顺子","同花","葫芦","四条","同花顺","皇家同花顺"]
    
    //param
    this.userPosRate;                   //九个座位的坐标，按比值
    this.userSizeRate;                  //座位的大小，按比例


    this.scale;                         //全局缩放比

    //this.currentDrawUser;               //当前玩家

    // room info
    this.currentRoomID;                 //房间ID
    this.bb;                            //大盲注
    this.sb;                            //小盲注
    this.timeoutMaxCount;               //最大计时

    //user info
    this.chips                          //玩家手上剩余筹码
    this.userName;                      //用户名

    //this.currentBettinglines;           //当前注额
    //this.bankerPos;                     //庄家座位号
    

    this.waitSelected1;                 //等待时按钮选择状态1
    this.waitSelected2;                 //等待时按钮选择状态2
    this.waitSelected3;                 //等待时按钮选择状态3

    this.sliderMinNum;                  //滑块最小值
    this.sliderMaxNum;                  //滑块最大值

    this.chipboxOpened;

    //class
    this.userList;                      //玩家对象
    this.starGroup;                     //掉落金币动画对象
    this.light;                         //聚光灯
    this.drawRectAnime;                 //画边框对象

    this.animation;                     //动画特效类
    //this.deskCardIDs = []
    //this.lstCardImage = []

    //control
    this.background;                    //背景图
    this.button1;                       //按钮1
    this.button2;                       //按钮2
    this.button3;                       //按钮3
    this.buttonGroup1;
    this.buttonGroup2;
    this.buttonGroup3;
    this.waitbutton1;                   //等待时按钮1
    this.waitbutton2;                   //等待时按钮2
    this.waitbutton3;                   //等待时按钮3
    this.waitButtonGroup1;
    this.waitButtonGroup2;
    this.waitButtonGroup3;
    this.lbLookorGiveup;                //文本(看牌或弃牌)
    this.lbCall;                        //文本(跟注)
    this.lbCallEvery;                   //文本(全下)
    this.lbLookorGiveupWait;            //文本(看牌或弃牌,等待)
    this.imgLookorGiveupWait;           //选择(看牌或弃牌,等待)
    this.lbCallWait;                    //文本(跟注,等待)
    this.imgCallWait;                   //选择(跟注,等待)
    this.lbCallEveryWait;               //文本(全下,等待)
    this.imgCallEveryWait;              //选择(全下,等待)
    this.blinds;                        //盲注控件
    this.publicCards;                   //公共牌（五张）
    this.praviteCards;                  //底牌(别人的八张)
    this.selfCards;                     //底牌(自己的两张)
    this.chipPoolBK;                    //筹码池背景
    this.chipPool;                      //筹码池
    this.chipPoolCoins;                 //收集的筹码块(动画用)
    this.chipbox;                       //加注选择框
    this.chipboxButton1;                //加注选择按钮1
    this.chipboxButton2;                //加注选择按钮2
    this.chipboxButton3;                //加注选择按钮3
    this.chipboxButton4;                //加注选择按钮4
    this.chipboxText1;                  //加注选择按钮文字1
    this.chipboxText2;                  //加注选择按钮文字2
    this.chipboxText3;                  //加注选择按钮文字3
    this.chipboxText4;                  //加注选择按钮文字4
    this.chipboxSliderGroove;           //加注滑条凹槽
    this.chipboxSliderHandle;           //加注滑条滑块
    this.chipboxTextSlider;             //加注滑块当前值
    this.chipboxGroup;
    this.currentBet;                    //最近bet值
    this.currentBetType;                //最近bet类型
    this.autoCall=0;                    // 纪录当前跟注值
    this.btnExitRoom;
    this.xOffset;
    this.yOffset;

    this.groupUser // game user layer


    // game current data
    this.gameStateObj = {}
    this.gameStateObj.mybet;                         //当前玩家需要下注额下
    this.gameStateObj.bankerPos;                     //庄家座位号
    this.gameStateObj.playerSeatNum;                     //庄家标记位置
    this.gameStateObj.mybetOnDesk;                   //当前玩家本局下注额
    this.gameStateObj.chipboxValue1 = 10;
    this.gameStateObj.chipboxValue2 = 20;
    this.gameStateObj.chipboxValue3 = 40;
}



MainState.prototype = {

    preload:function() {
        game.load.image("gamecenterbackground", "assets/background.png");
        game.load.image('playerBK', 'assets/player-me.png');
        game.load.image('userBK', 'assets/player-guest.png');
        game.load.image('blankBK', 'assets/player-blank.png');
        game.load.image("winBK", "assets/win-frame-bg.png");
        game.load.image("winBKFrame", "assets/win-frame.png");
        game.load.image('defaultUserImage', 'assets/coin.png');
        game.load.image('buttonblue', 'assets/btn-blue.png');
        game.load.image('buttongrey', 'assets/btn-grey.png');
        game.load.image('buttonyellow', 'assets/btn-yellow.png');
        game.load.image('animeCoins', 'assets/coin.png');
        game.load.image("light", "assets/roomLight.png");
        var cardImageName = ["spades", "hearts", "clubs", "diamonds"];
        var cardName = ["S", "H", "C", "D"];
        var cardNumber = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
        for(var i = 0; i < cardImageName.length; i++)
        {
            for(var j = 0; j < cardNumber.length; j++)
            {
                game.load.image(cardName[i] + cardNumber[j], "assets/cards/card_" + cardImageName[i] + "_" + (j + 1) + ".png");
            }
        }
        game.load.image("cardBK", "assets/cards/card_back.png");
        game.load.image("chipPool", "assets/chip-pool.png");
        game.load.image("chip01", "assets/texas_chip01.png");
        game.load.image("chip05", "assets/texas_chip05.png");
        game.load.image("chip1k", "assets/texas_chip1k.png");
        game.load.image("chip5k", "assets/texas_chip5k.png");
        game.load.image("chip10w", "assets/texas_chip10w.png");
        game.load.image("chip50w", "assets/texas_chip50w.png");
        game.load.image("dcardBK", "assets/card_backs_rotate.png");
        game.load.image("checkOn", "assets/check-on.png");
        game.load.image("checkOff", "assets/check-off.png");
        game.load.image("chipbox", "assets/add-chips-box.png");
        game.load.image("winLight", "assets/light_dot.png");
        game.load.image("groove", "assets/sliderGroove.png");
        game.load.image("exitdoor", "assets/btn-grey.png");
        game.load.image("dealer", "assets/dealer.png");
    },

    create: function() {

        this.animation = new Animations();
        this.imageBK = game.add.image(0, 0, "gamecenterbackground");
        
        var xScale = game.width / this.imageBK.width;
        var yScale = game.height / this.imageBK.height;
        
        //if(gParam.platform == "IOS") {
        //    xScale = 1;
        //    yScale = 1;
        //}

        this.scale = xScale < yScale ? xScale : yScale;
        this.xOffset = (game.width - this.imageBK.width * this.scale) / 2;
        this.yOffset = (game.height - this.imageBK.height * this.scale) / 2;
        this.imageBK.scale.setTo(this.scale, this.scale);
        this.background = this.imageBK;
        this.imageBK.reset(this.xOffset, this.yOffset);
        this.currentDrawUser = 0;
        this.timeoutMaxCount = 30;
        this.sliderMinNum = 0;
        this.sliderMaxNum = 100;
        this.userList = [];
        this.userName = "cmdTest";
        this.currentRoomID = "0";
        this.bb = 0;
        this.sb = 0;
        this.publicCards = [];
        this.praviteCards = [];
        this.selfCards = [];
        this.chipPoolCoins = [];
        this.waitSelected1 = false;
        this.waitSelected2 = false;
        this.waitSelected3 = false;
        this.dealerPosRate = [{x:0.632, y:0.312}, {x:0.796, y:0.349}, {x:0.841, y:0.434}, {x:0.694, y:0.570}, {x: 0.44, y:0.574}, {x:0.306, y:0.570}, {x:0.154, y:0.434}, {x:0.204, y:0.349}, {x:0.368, y:0.312}];
        //this.userPosRate = [{x:0.692, y:0.152}, {x:0.856, y:0.187}, {x:0.914, y:0.54}, {x:0.754, y:0.734}, {x: 0.5, y:0.734}, {x:0.246, y:0.734}, {x:0.086, y:0.54}, {x:0.144, y:0.187}, {x:0.308, y:0.152}];
        this.userPosRate = [{x:0.692, y:0.152}, {x:0.856, y:0.187}, {x:0.914, y:0.54}, {x:0.754, y:0.734}, {x: 0.5, y:0.734}, {x:0.246, y:0.734}, {x:0.086, y:0.54}, {x:0.144, y:0.187}, {x:0.308, y:0.152}];
        this.userSizeRate = {width:0.096, height:0.262};
        var userCoinRate = [{x:0.656, y:0.292}, {x:0.82, y:0.329}, {x:0.831, y:0.484}, {x:0.673, y:0.613}, {x:0.464, y:0.557}, {x:0.305, y:0.613}, {x:0.139, y:0.484}, {x:0.108, y:0.329}, {x:0.27, y:0.292}];
        var userCoinWidth = 27 * this.scale;
        var userTextRate = [{x:0.69, y:0.292}, {x:0.856, y:0.329}, {x:0.768, y:0.484}, {x:0.61, y:0.613}, {x:0.5, y:0.557}, {x:0.339, y:0.613}, {x:0.173, y:0.484}, {x:0.142, y:0.329}, {x:0.306, y:0.292}];

        game.load.onFileComplete.add(this._fileComplete, this);

        this.animation.setPosParam(this.background.width, this.background.height, this.xOffset, this.yOffset);
        this.groupUser = game.add.group();

        for (var i = 0; i < this.userPosRate.length; i++)
        {
            var dict = this.userPosRate[i];
            var user = new User();
            user.setScale(this.scale);
            user.setAnimation(this.animation);
            user.setRect((dict.x - this.userSizeRate.width / 2) * this.imageBK.width + this.xOffset, (dict.y - this.userSizeRate.height / 2) * this.imageBK.height + this.yOffset, this.userSizeRate.width * this.imageBK.width, this.userSizeRate.height * this.imageBK.height);
            user.setCoinRect(userCoinRate[i].x * this.imageBK.width + userCoinWidth / 2 + this.xOffset, userCoinRate[i].y * this.imageBK.height + userCoinWidth / 2 + this.yOffset, userCoinWidth, userCoinWidth);
            user.setCoinTextPos(userTextRate[i].x * this.imageBK.width + this.xOffset, userTextRate[i].y * this.imageBK.height + this.yOffset);
            if(dict.x == 0.5)
            {
                //user.create("", "defaultUserImage", "", true);
                user.create("", null, "", true);
            }
            else
            {
                //user.create("", "defaultUserImage", "", false);
                user.create("", null, "", false);
            }
            user.addUserToGroup(this.groupUser)
            user.setVisable(false);
            this.userList.push(user);
        }

        this.cardPosRate = [{x:0.344, y:0.456}, {x:0.422, y:0.456}, {x:0.5, y:0.456}, {x:0.578, y:0.456}, {x:0.656, y:0.456}];
        this.cardSizeRate = {width:0.064, height:0.156};
        for (var i = 0; i < this.cardPosRate.length; i++)
        {
            var dict = this.cardPosRate[i];
            var imageCard = game.add.image(dict.x * this.imageBK.width + this.xOffset, dict.y * this.imageBK.height + this.yOffset, "cardBK");
            imageCard.anchor.set(0.5);
            imageCard.scale.setTo(this.scale, this.scale);
            imageCard.visible = false;
            this.publicCards.push(imageCard);
        }
        this.animation.setPublicCard(this.publicCards);

        var preflopBKRate = [{x:0.722, y:0.203}, {x:0.889, y:0.241}, {x:0.945, y:0.594}, {x:0.787, y:0.788}, {x:0.167, y:0.788}, {x:0.011, y:0.594}, {x:0.071, y:0.241}, {x:0.236, y:0.203}];
        for (var i = 0; i < preflopBKRate.length; i++)
        {
            var dict = preflopBKRate[i];
            var imageCard = game.add.image(dict.x * this.imageBK.width + this.xOffset, dict.y * this.imageBK.height + this.yOffset, "dcardBK");
            imageCard.scale.setTo(this.scale, this.scale);
            imageCard.visible = false;
            this.praviteCards.push(imageCard);

            if (i < 4) {
                this.userList[i].setDcard(imageCard)
            } else {
                this.userList[i+1].setDcard(imageCard)
            }
        }

        var selfCardRate = {x:0.57, y:0.79};
        var imageCard1 = game.add.image(selfCardRate.x * this.imageBK.width + this.xOffset, selfCardRate.y * this.imageBK.height + this.yOffset, "cardBK");
        imageCard1.scale.setTo(this.scale * 0.75, this.scale * 0.75);
        imageCard1.anchor = new PIXI.Point(0.5, 0.5);
        imageCard1.angle = -20;
        imageCard1.visible = false;
        this.selfCards.push(imageCard1);
        var imageCard2 = game.add.image(selfCardRate.x * this.imageBK.width + imageCard1.width / 2 + this.xOffset, selfCardRate.y * this.imageBK.height + this.yOffset, "cardBK");
        imageCard2.scale.setTo(this.scale * 0.75, this.scale * 0.75);
        imageCard2.anchor = new PIXI.Point(0.5, 0.5);
        imageCard2.angle = 20;
        imageCard2.visible = false;
        this.selfCards.push(imageCard2);

        this.light = game.add.sprite(this.imageBK.width / 2 + this.xOffset, this.imageBK.height / 2 + this.yOffset, 'light');
        this.light.anchor.setTo(0, 0.5);
        this.light.scale.setTo(this.scale);
        this.light.visible = false;
        this.animation.setLight(this.light);

        this.chipbox = game.add.sprite(0, 0, "chipbox");
        this.chipbox.scale.setTo(this.scale, this.scale);
        this.chipboxButton1 = game.add.button(0, 0, 'buttonyellow', this.chipOnClick1, this);
        this.chipboxButton2 = game.add.button(0, 0, 'buttonblue', this.chipOnClick2, this);
        this.chipboxButton3 = game.add.button(0, 0, 'buttonblue', this.chipOnClick3, this);
        this.chipboxButton4 = game.add.button(0, 0, 'buttonblue', this.chipOnClick4, this);
        var style = { font: "28px Arial", fill: "#CE8D00"};
        this.chipboxText1 = game.add.text(0, 0, "全部", style);
        style = { font: "28px Arial", fill: "#0069B2"};
        this.chipboxText2 = game.add.text(0, 0, "120", style);
        this.chipboxText3 = game.add.text(0, 0, "80", style);
        this.chipboxText4 = game.add.text(0, 0, "50", style);
        this.chipboxText1.anchor.set(0.5);
        this.chipboxText2.anchor.set(0.5);
        this.chipboxText3.anchor.set(0.5);
        this.chipboxText4.anchor.set(0.5);
        this.chipboxText1.scale.setTo(this.scale, this.scale);
        this.chipboxText2.scale.setTo(this.scale, this.scale);
        this.chipboxText3.scale.setTo(this.scale, this.scale);
        this.chipboxText4.scale.setTo(this.scale, this.scale);
        this.chipboxSliderGroove = game.add.sprite(0, 0, "groove");
        this.chipboxSliderHandle = game.add.sprite(0, 0, "buttonblue");
        this.chipboxSliderGroove.anchor.set(0.5);
        this.chipboxSliderHandle.anchor.set(0.5);
        style = { font: "32px Arial", fill: "#CE8D00"};
        this.chipboxTextSlider = game.add.text(0, 0, "0", style);
        this.chipboxTextSlider.anchor.set(0.5);
        this.chipboxTextSlider.scale.setTo(this.scale, this.scale);
        this.chipboxGroup = game.add.group();
        this.chipboxGroup.add(this.chipbox);
        this.chipboxGroup.add(this.chipboxButton1);
        this.chipboxGroup.add(this.chipboxButton2);
        this.chipboxGroup.add(this.chipboxButton3);
        this.chipboxGroup.add(this.chipboxButton4);
        this.chipboxGroup.add(this.chipboxText1);
        this.chipboxGroup.add(this.chipboxText2);
        this.chipboxGroup.add(this.chipboxText3);
        this.chipboxGroup.add(this.chipboxText4);
        this.chipboxGroup.add(this.chipboxSliderGroove);
        this.chipboxGroup.add(this.chipboxSliderHandle);
        this.chipboxGroup.add(this.chipboxTextSlider);
        this.chipboxGroup.visible = false;

        var buttonPosRate1 = {x:0.167, y:0.881};
        var buttonPosRate2 = {x:0.394, y:0.881};
        var buttonPosRate3 = {x:0.62, y:0.881};
        var buttonSizeRate = {width:0.213, height:0.119};
        this.button1 = game.add.button(buttonPosRate1.x * this.imageBK.width + this.xOffset, buttonPosRate1.y * this.imageBK.height + this.yOffset, 'buttonyellow', this.actionOnClick1, this);
        this.button2 = game.add.button(buttonPosRate2.x * this.imageBK.width + this.xOffset, buttonPosRate2.y * this.imageBK.height + this.yOffset, 'buttonyellow', this.actionOnClick2, this);
        this.button3 = game.add.button(buttonPosRate3.x * this.imageBK.width + this.xOffset, buttonPosRate3.y * this.imageBK.height + this.yOffset, 'buttonyellow', this.actionOnClick3, this);
        this.button1.scale.setTo(this.scale, this.scale);
        this.button2.scale.setTo(this.scale, this.scale);
        this.button3.scale.setTo(this.scale, this.scale);
        this.waitbutton1 = game.add.button(buttonPosRate1.x * this.imageBK.width + this.xOffset, buttonPosRate1.y * this.imageBK.height + this.yOffset, 'buttonblue', this.waitOnClick1, this);
        this.waitbutton2 = game.add.button(buttonPosRate2.x * this.imageBK.width + this.xOffset, buttonPosRate2.y * this.imageBK.height + this.yOffset, 'buttonblue', this.waitOnClick2, this);
        this.waitbutton3 = game.add.button(buttonPosRate3.x * this.imageBK.width + this.xOffset, buttonPosRate3.y * this.imageBK.height + this.yOffset, 'buttonblue', this.waitOnClick3, this);
        this.waitbutton1.scale.setTo(this.scale, this.scale);
        this.waitbutton2.scale.setTo(this.scale, this.scale);
        this.waitbutton3.scale.setTo(this.scale, this.scale);

        this.buttonGroup1 = game.add.group();
        this.buttonGroup2 = game.add.group();
        this.buttonGroup3 = game.add.group();
        this._setBetButtonsVisible(false)
        this.waitButtonGroup1 = game.add.group();
        this.waitButtonGroup2 = game.add.group();
        this.waitButtonGroup3 = game.add.group();
        this._setWaitButtonsVisible(false)

        style = { font: "28px Arial", fill: "#CE8D00", wordWrap: false, wordWrapWidth: this.button1.width, align: "center" };
        this.lbLookorGiveup = game.add.text(buttonPosRate1.x * this.imageBK.width + this.xOffset + 0.5 * this.button1.width, buttonPosRate1.y * this.imageBK.height + this.yOffset + 0.45 * this.button1.height, "弃牌", style);
        this.lbLookorGiveup.anchor.set(0.5);
        this.lbLookorGiveup.scale.setTo(this.scale, this.scale);
        this.buttonGroup1.add(this.button1);
        this.buttonGroup1.add(this.lbLookorGiveup);
        style = { font: "28px Arial", fill: "#CE8D00", wordWrap: false, wordWrapWidth: this.button2.width, align: "left" };
        this.lbCall = game.add.text(buttonPosRate2.x * this.imageBK.width + this.xOffset + 0.2 * this.button2.width, buttonPosRate2.y * this.imageBK.height + this.yOffset + 0.45 * this.button2.height, "跟注", style);
        this.lbCall.anchor.set(0, 0.5);
        this.lbCall.scale.setTo(this.scale, this.scale);
        this.buttonGroup2.add(this.button2);
        this.buttonGroup2.add(this.lbCall);
        style = { font: "28px Arial", fill: "#CE8D00", wordWrap: false, wordWrapWidth: this.button3.width, align: "center" };
        this.lbCallEvery = game.add.text(buttonPosRate3.x * this.imageBK.width + this.xOffset + 0.5 * this.waitbutton3.width, buttonPosRate3.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton3.height, "加注", style);
        this.lbCallEvery.anchor.set(0.5);
        this.lbCallEvery.scale.setTo(this.scale, this.scale);
        this.buttonGroup3.add(this.button3);
        this.buttonGroup3.add(this.lbCallEvery);

        style = { font: "24px Arial", fill: "#0069B2", wordWrap: false, wordWrapWidth: 0.6 * this.waitbutton1.width, align: "left" };
        this.lbLookorGiveupWait = game.add.text(buttonPosRate1.x * this.imageBK.width + this.xOffset + 0.35 * this.waitbutton1.width, buttonPosRate1.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton1.height, "看牌或弃牌", style);
        this.lbLookorGiveupWait.anchor.set(0, 0.5);
        this.lbLookorGiveupWait.scale.setTo(this.scale, this.scale);
        this.imgLookorGiveupWait = game.add.image(buttonPosRate1.x * this.imageBK.width + this.xOffset + 0.2 * this.waitbutton1.width, buttonPosRate1.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton1.height, "checkOff");
        this.imgLookorGiveupWait.anchor.set(0.5);
        this.imgLookorGiveupWait.scale.setTo(this.scale, this.scale);
        this.waitButtonGroup1.add(this.waitbutton1);
        this.waitButtonGroup1.add(this.lbLookorGiveupWait);
        this.waitButtonGroup1.add(this.imgLookorGiveupWait);
        style = { font: "24px Arial", fill: "#0069B2", wordWrap: false, wordWrapWidth: 0.6 * this.waitbutton2.width, align: "left" };
        this.lbCallWait = game.add.text(buttonPosRate2.x * this.imageBK.width + this.xOffset + 0.35 * this.waitbutton2.width, buttonPosRate2.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton2.height, "跟注", style);
        this.lbCallWait.anchor.set(0, 0.5);
        this.lbCallWait.scale.setTo(this.scale, this.scale);
        this.imgCallWait = game.add.image(buttonPosRate2.x * this.imageBK.width + this.xOffset + 0.2 * this.waitbutton2.width, buttonPosRate2.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton2.height, "checkOff");
        this.imgCallWait.anchor.set(0.5);
        this.imgCallWait.scale.setTo(this.scale, this.scale);
        this.waitButtonGroup2.add(this.waitbutton2);
        this.waitButtonGroup2.add(this.lbCallWait);
        this.waitButtonGroup2.add(this.imgCallWait);
        style = { font: "24px Arial", fill: "#0069B2", wordWrap: false, wordWrapWidth: 0.6 * this.waitbutton3.width, align: "left" };
        this.lbCallEveryWait = game.add.text(buttonPosRate3.x * this.imageBK.width + this.xOffset + 0.45 * this.waitbutton3.width, buttonPosRate3.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton3.height, "跟任何注", style);
        this.lbCallEveryWait.anchor.set(0, 0.5);
        this.lbCallEveryWait.scale.setTo(this.scale, this.scale);
        this.imgCallEveryWait = game.add.image(buttonPosRate3.x * this.imageBK.width + this.xOffset + 0.2 * this.waitbutton3.width, buttonPosRate3.y * this.imageBK.height + this.yOffset + 0.45 * this.waitbutton3.height, "checkOff");
        this.imgCallEveryWait.anchor.set(0.5);
        this.imgCallEveryWait.scale.setTo(this.scale, this.scale);
        this.waitButtonGroup3.add(this.waitbutton3);
        this.waitButtonGroup3.add(this.lbCallEveryWait);
        this.waitButtonGroup3.add(this.imgCallEveryWait);

        this.chipbox.x = this.button3.x + this.button3.width * 0.04;
        this.chipbox.y = this.button3.y - this.chipbox.height * 0.99;
        this.chipbox.width = this.button3.width * 0.92;
        this.chipboxButton1.x = this.chipbox.x + this.chipbox.width * 0.1;
        this.chipboxButton1.y = this.chipbox.y + this.chipbox.height * 0.08;
        this.chipboxButton1.width = this.chipbox.width * 0.3;
        this.chipboxButton1.height = this.chipbox.height * 0.18;
        this.chipboxButton2.x = this.chipbox.x + this.chipbox.width * 0.1;
        this.chipboxButton2.y = this.chipbox.y + this.chipbox.height * 0.31;
        this.chipboxButton2.width = this.chipbox.width * 0.3;
        this.chipboxButton2.height = this.chipbox.height * 0.18;
        this.chipboxButton3.x = this.chipbox.x + this.chipbox.width * 0.1;
        this.chipboxButton3.y = this.chipbox.y + this.chipbox.height * 0.54;
        this.chipboxButton3.width = this.chipbox.width * 0.3;
        this.chipboxButton3.height = this.chipbox.height * 0.18;
        this.chipboxButton4.x = this.chipbox.x + this.chipbox.width * 0.1;
        this.chipboxButton4.y = this.chipbox.y + this.chipbox.height * 0.78;
        this.chipboxButton4.width = this.chipbox.width * 0.3;
        this.chipboxButton4.height = this.chipbox.height * 0.18;
        this.chipboxText1.x = this.chipboxButton1.x + this.chipboxButton1.width * 0.5;
        this.chipboxText1.y = this.chipboxButton1.y + this.chipboxButton1.height * 0.45;
        this.chipboxText2.x = this.chipboxButton2.x + this.chipboxButton2.width * 0.5;
        this.chipboxText2.y = this.chipboxButton2.y + this.chipboxButton2.height * 0.45;
        this.chipboxText3.x = this.chipboxButton3.x + this.chipboxButton3.width * 0.5;
        this.chipboxText3.y = this.chipboxButton3.y + this.chipboxButton3.height * 0.45;
        this.chipboxText4.x = this.chipboxButton4.x + this.chipboxButton4.width * 0.5;
        this.chipboxText4.y = this.chipboxButton4.y + this.chipboxButton4.height * 0.45;
        this.chipboxTextSlider.x = this.chipbox.x + this.chipbox.width * 0.7;
        this.chipboxTextSlider.y = this.chipboxButton1.y + this.chipboxButton1.height * 0.5;
        this.chipboxSliderGroove.width = this.chipbox.width * 0.1;
        this.chipboxSliderGroove.height = this.chipbox.height * 0.7;
        this.chipboxSliderGroove.x = this.chipbox.x + this.chipbox.width * 0.7;
        this.chipboxSliderGroove.y = this.chipboxButton4.y + this.chipboxButton4.height - this.chipboxSliderGroove.height * 0.5;
        this.chipboxSliderHandle.width = this.chipbox.width * 0.2;
        this.chipboxSliderHandle.height = this.chipboxSliderHandle.width * 0.5;
        this.chipboxSliderHandle.x = this.chipbox.x + this.chipbox.width * 0.7;
        this.chipboxSliderHandle.y = this.chipboxSliderGroove.y + this.chipboxSliderGroove.height * 0.5 - this.chipboxSliderHandle.height * 0.5;
        this.chipboxSliderHandle.inputEnabled = true;
        this.chipboxSliderHandle.input.enableDrag();
        this.chipboxSliderHandle.input.setDragLock(false);
        this.dealer = null;
        //this.chipboxSliderHandle.events.onDragStart.add(onDragStart, this);
        //this.chipboxSliderHandle.events.onDragStop.add(onDragStop, this);

        style = { font: "16px Arial", fill: "#76FF68", wordWrap: true, wordWrapWidth: this.background.width, align: "center" };
        this.blinds = game.add.text(this.background.width / 2 + this.xOffset, 0.25 * this.background.height + this.yOffset, "$" + this.sb + " / $" + this.bb, style);
        this.blinds.anchor.set(0.5);
        this.blinds.scale.setTo(this.scale);

        this.chipPoolBK = game.add.image(0.451 * this.imageBK.width + this.xOffset, 0.306 * this.imageBK.height + this.yOffset, "chipPool");
        this.chipPoolBK.scale.setTo(this.scale, this.scale);

        style = { font: "16px Arial", fill: "#FFFFFF", wordWrap: true, wordWrapWidth: this.chipPoolBK.width, align: "center" };
        this.chipPool = game.add.text(this.chipPoolBK.x + this.chipPoolBK.width / 2, this.chipPoolBK.y + this.chipPoolBK.height / 2, "0", style);
        this.chipPool.anchor.set(0.5);
        this.chipPool.scale.setTo(this.scale);

        this.btnExitRoom = game.add.button(0.92 * this.imageBK.width + this.xOffset, 0.02 * this.imageBK.height + this.yOffset, 'exitdoor', this.actionOnExit, this);
        this.btnExitRoom.width = this.chipboxButton1.width;
        this.btnExitRoom.height = this.chipboxButton1.height;

        this.starGroup = game.add.group();
        this.starGroup.enableBody = true;

        var coinCount = 9;
        for (var i = 0; i < coinCount; i++)
        {
            var star = this.starGroup.create((i + 0.5) * this.imageBK.width / coinCount + this.xOffset, 0, 'animeCoins');
            star.visible = false;
            star.body.velocity.y = 0;
            star.anchor.setTo(0.5, 0.5);
            star.rotation = 100*Math.random();
        }

        this.drawRectAnime = new rectdrawer(this.groupUser);

        this._currentPlayButtonUpdate(false);
        game.betApi.enterRoom(function(isOK){
            console.log("enterRoom is " +  isOK);
            if(isOK)
            {
            }
            else
            {
                game.state.start("LoginState");
                alert("进入房间失败!");
            }
        });
    },

    update:function()
    {
        if(this.chipbox.visible) {
            var nMaxPos = this.chipboxSliderGroove.y + this.chipboxSliderGroove.height * 0.5 - this.chipboxSliderHandle.height * 0.5;
            var nMinPos = this.chipboxSliderGroove.y - this.chipboxSliderGroove.height * 0.5 + this.chipboxSliderHandle.height * 0.5;
            if(this.chipboxSliderHandle.y > nMaxPos)
            {
                this.chipboxSliderHandle.y = nMaxPos;
            }
            if(this.chipboxSliderHandle.y < nMinPos)
            {
                this.chipboxSliderHandle.y = nMinPos;
            }

            var value = Math.round(this.sliderMaxNum - (this.chipboxSliderHandle.y - nMinPos) / (nMaxPos - nMinPos) * (this.sliderMaxNum - this.sliderMinNum));
            value = Math.round(value / 5) * 5;
            this.chipboxTextSlider.setText(value);
        }
    },

    _fileComplete:function(progress, cacheKey, success, totalLoaded, totalFiles)
    {
        if(cacheKey.indexOf("userImage") != -1)
        {
            var index = parseInt(cacheKey.substr(9));
            var user = this.userList[index];
            user.setParam(null, "userImage" + index, null);
        }
    },

    actionOnExit:function()
    {
        game.betApi.leaveRoom();
        game.state.start("LoginState");
    },

    // 看或弃牌
    waitOnClick1:function()
    {
        if(this.waitSelected1)
        {
            this.waitSelected1 = false;
            this.imgLookorGiveupWait.loadTexture("checkOff", this.imgLookorGiveupWait.frame);
        }
        else
        {
            this.waitSelected1 = true;
            this.waitSelected2 = false;
            this.waitSelected3 = false;
            this.imgLookorGiveupWait.loadTexture("checkOn", this.imgLookorGiveupWait.frame);
            this.imgCallWait.loadTexture("checkOff", this.imgCallWait.frame);
            this.imgCallEveryWait.loadTexture("checkOff", this.imgCallEveryWait.frame);
        }
    },

    // 自动看牌／自动跟注
    waitOnClick2:function()
    {
        if(this.waitSelected2)
        {
            this.waitSelected2 = false;
            this.imgCallWait.loadTexture("checkOff", this.imgCallWait.frame);
            this.lbCallWait.setText("看牌或跟注");
        }
        else
        {
            this.waitSelected1 = false;
            this.waitSelected2 = true;
            this.waitSelected3 = false;
            this.imgLookorGiveupWait.loadTexture("checkOff", this.imgLookorGiveupWait.frame);
            this.imgCallWait.loadTexture("checkOn", this.imgCallWait.frame);
            this.imgCallEveryWait.loadTexture("checkOff", this.imgCallEveryWait.frame);

            var bet = this.currentBet - this.gameStateObj.mybetOnDesk;
            // TODO:
            if (bet > 0) {
                this.lbCallWait.setText("跟注 "+ bet);
            } else if (bet == 0) {
                this.lbCallWait.setText("看牌");
            }

        }
    },

    // 跟任何注
    waitOnClick3:function()
    {
        if(this.waitSelected3)
        {
            this.waitSelected3 = false;
            this.imgCallEveryWait.loadTexture("checkOff", this.imgCallEveryWait.frame);
        }
        else
        {
            this.waitSelected1 = false;
            this.waitSelected2 = false;
            this.waitSelected3 = true;
            this.imgLookorGiveupWait.loadTexture("checkOff", this.imgLookorGiveupWait.frame);
            this.imgCallWait.loadTexture("checkOff", this.imgCallWait.frame);
            this.imgCallEveryWait.loadTexture("checkOn", this.imgCallEveryWait.frame);
        }
    },

    // 弃牌
    actionOnClick1:function()
    {
        var that = this
        game.betApi.betFold(function(isok) {
            // send OK or NOK
            that._setBetButtonsVisible(false)
        });
    },

    // 跟注
    actionOnClick2:function()
    {
        var that = this
        var betdiff = this.gameStateObj.mybet-this.gameStateObj.mybetOnDesk


        //if (betdiff > 0 ) {
            game.betApi.bet(betdiff,function(isok) {
                // send OK or NOK
                that._setBetButtonsVisible(false)
            })
        //};
    },


    _raseAction:function(value) {
        var that = this
        game.betApi.bet(value,function(isok) {
                // send OK or NOK
                that._setBetButtonsVisible(false)
            })

        this.chipboxGroup.visible = false;
    },

    // 加注
    actionOnClick3:function()
    {

        if(this.chipboxGroup.visible)
        {
            var text = this.chipboxTextSlider.text
            var betValue = parseInt(text)
            this._raseAction(betValue)

        }
        else
        {
            var bet = this.gameStateObj.mybet - this.gameStateObj.mybetOnDesk;

            if(bet > 0) {
                bet=bet*2
            }

            this._updatePoolChipValue(bet*2?bet*2:10*2);
            this._setSliderRange(bet, this.chips);
            this.chipboxGroup.visible = true;
            this.chipboxOpened = true;
        }
    },

    chipOnClick1:function()
    {
        this._raseAction(this.chips)
    },

    chipOnClick2:function()
    {
        //this.chipboxGroup.visible = false;
        //this._setSliderValue(this.gameStateObj.chipboxValue3)
        this._raseAction(this.gameStateObj.chipboxValue3)
    },

    chipOnClick3:function()
    {
        //this._setSliderValue(this.gameStateObj.chipboxValue2)
        this._raseAction(this.gameStateObj.chipboxValue2)
    },

    chipOnClick4:function()
    {
        //this._setSliderValue(this.gameStateObj.chipboxValue1)
        this._raseAction(this.gameStateObj.chipboxValue1)
    },

    _showCoinAnime:function()
    {
        this.starGroup.forEach(function(child){
            child.y = 0;
            child.visible = true;
            child.body.velocity.y = 500 + 150 * Math.random();
        }, this);
    },

    callbackOpen:function(data)
    {
        console.log("callbackOpen " + data);

        game.betApi.checkVersion(this.strVersion, function(isOK){
            console.log("checkVersion " + isOK);
        });
    },

    callbackClose:function(data)
    {
        console.log("callbackClose " + data);
        this.loginCertification = false;

        this._disconnectReset();
    },

    callbackMessage:function(data)
    {
        console.log("callbackMessage " + data);
        if(data.version && data.version == this.strVersion) // checkVersion result
        {
            game.betApi.loginCertification(gParam.user_name, function(isOK){
                console.log("loginCertification is " +  isOK);
                //alert("loginCertification is" +  isOK);
            });
        }
        else if(!this.loginCertification) // loginCertification result
        {
            if(data.id)
            {
                this.userID = data.id;
                game.betApi.setUserID(this.userID);
                this.loginCertification = true;

                this._currentPlayButtonUpdate(false)

                game.betApi.setRoomID(this.roomID);
                game.betApi.enterRoom(function(isOK){
                    console.log("enterRoom is " +  isOK);
                });
            }
        }
        else if(data.type == "iq")
        {
            if(data.class == "room.list")       //查询游戏房间列表
            {

            }
            else if(data.class == "room.info")  //查询游戏房间信息
            {

            }
            else if(data.class == "user.info")  //查询玩家信息
            {

            }
        }
        else if(data.type == "message")
        {
        }
        else if(data.type == "presence")
        {
            if(data.action == "active")         //服务器广播进入房间的玩家
            {
            }
            else if(data.action == "gone")      //服务器广播离开房间的玩家
            {
                this.handleGone(data)
            }
            else if(data.action == "join")      //服务器通报加入游戏的玩家
            {
                this.handleJoin(data);
            }
            else if(data.action == "button")    //服务器通报本局庄家
            {
                this.handleButton(data);
            }
            else if(data.action == "preflop")   //服务器通报发牌
            {
                this.handlePreflop(data);
            }
            else if(data.action == "flop")   //发牌
            {
                this.handleFlop(data);
            }
            else if(data.action == "turn")   //发牌
            {
                this.handleTurn(data);
            }
            else if(data.action == "river")   //发牌
            {
                this.handleRiver(data);
            }
            else if(data.action == "pot")       //服务器通报奖池
            {
                this.handlePot(data)
            }
            else if(data.action == "action")    //服务器通报当前下注玩家
            {
                this.handleAction(data);

            }
            else if(data.action == "bet")       //服务器通报玩家下注结果
            {
                this.handleBet(data);

            }
            else if(data.action == "showdown")  //服务器通报摊牌和比牌
            {
                this.handleShowDown(data);
            }
            else if(data.action == "state")  //服务器通报房间信息
            {
                this.handleState(data);
            }
        }
    },

    callbackError:function(data)
    {
        console.log("callbackError" + data);
    },

    handleJoin:function(data)
    {
        var occupant = data.occupant;
        //通过和自己的座位号码推算应该在第几个座位
        var self = this.userList[ (this.userList.length - 1) / 2];
        var seatOffset = occupant.index - self.param.seatNum;
        var userIndex = (this.userList.length - 1) / 2 + seatOffset;
        if(userIndex >= this.userList.length)
        {
            userIndex -= this.userList.length;
        }
        else if(userIndex < 0)
        {
            userIndex += this.userList.length;
        }
        var user = this.userList[userIndex];
        if(occupant.profile && occupant.profile != "")
        {
            game.load.image("userImage" + userIndex, occupant.profile, true);
            game.load.start();
        }

        if (occupant.name == "") {
            console.log("error userName =", occupant.name);
        }

        user.setParam(occupant.name, occupant.profile, occupant.chips);
        user.param.seatNum = occupant.index;
        user.param.userID = occupant.id;

        user.setVisable(true);
    },

    handlePot:function(data) {
        var arrayPool = data.class.split(",");

        this.chipPoolCoins = this.animation.showCollectChip(this.userList, this.chipPoolBK.x + this.chipPoolBK.width * 0.14, this.chipPoolBK.y + this.chipPoolBK.height * 0.5, this.chipPoolCoins);
        this._resetGameRoundStatus()
        this.chipPool.setText(arrayPool[0]);
    },

    handleGone:function(data) {
        var goneUserID = data.occupant.id;
        var user = this._userByUserID(goneUserID);
        user.clean();
        user.setVisable(false)

        var seatNum = user.param["seatNum"]
        if(this.gameStateObj.bankerPos == seatNum) {
            if(this.dealer != null) {
                this.dealer.destroy();
                this.dealer = null;
            }
        }
    },

    handleButton:function(data)
    {
        this.gameStateObj.bankerPos = data.class;
        var seatIndex = this._userIndexBySeatNum(parseInt(data.class))

        
        if(this.dealer == null) {
            this.dealer = game.add.sprite(this.dealerPosRate[seatIndex].x * this.imageBK.width + this.xOffset, this.dealerPosRate[seatIndex].y * this.imageBK.height + this.yOffset, "dealer");
            this.dealer.anchor.setTo(0.5);
            this.dealer.scale.setTo(this.scale, this.scale);

            this.groupUser.add(this.dealer);

        } else {
            
            var user = this._userBySeatNum(this.gameStateObj.bankerPos)
            if(user) {
                this.tween = game.add.tween(this.dealer);
                this.tween.to({ x:this.dealerPosRate[seatIndex].x * this.imageBK.width+ this.xOffset,
                           y: this.dealerPosRate[seatIndex].y * this.imageBK.height + this.yOffset }, 
                           800, 
                           Phaser.Easing.Linear.None, true);
            }
        
        }
        
        this._initNewRound()
    },

    handlePreflop:function(data)
    {
        var arrayCards = data.class.split(",");
        for(var i = 0; i < this.selfCards.length; i++)
        {
            var card = this.selfCards[i];
            card.visible = true;
            card.loadTexture(arrayCards[i], card.frame);
        }
        /*
        for(var i = 0; i < this.praviteCards.length; i++)
        {
            var card = this.praviteCards[i];
            card.visible = true;
        }
        */

    },
    
    handleFlop:function(data)
    {
        var arrayParam = data.class.split(",");
        var arrayCards = arrayParam.slice(0,3) 
        this.animation.setPublicCard(this.publicCards);
        this._flopAnimation(arrayCards[0], arrayCards[1], arrayCards[2])

        this._setBetCardType(arrayParam[3])
    },
    handleTurn:function(data)
    {
        var arrayCards = data.class.split(",");
        this._turnAnimation(arrayCards[0])

        this._setBetCardType(arrayCards[1])
        // TODO setName
    },

    handleRiver:function(data)
    {
        var arrayCards = data.class.split(",");
        this._riverAnimation(arrayCards[0])

        this._setBetCardType(arrayCards[1])
    },

    handleAction:function(data)
    {
        var arrayInfo = data.class.split(",");
        var seatNum = arrayInfo[0]; //座位号
        var bet = arrayInfo[1]; //单注额

        this.gameStateObj.playerSeatNum = seatNum

        var user = this._userBySeatNum(seatNum)
        this.gameStateObj.currentBettinglines = bet        

        // 当前玩家
        if (user.param.userID == userID) {

            if ( parseInt(bet) > 0 ) {
                this.gameStateObj.mybet = bet
            };

            var diffbet = this.gameStateObj.mybet - this.gameStateObj.mybetOnDesk


            if(diffbet==0) {
                this.lbCall.setText("看牌");
            } else if(diffbet > 0) {
                this.lbCall.setText("跟注 "+ diffbet);
            } else {
                alert("error ＝跟负值＝");
            }

            if(this._betWaitButtonChecked()) {
                this._autoAction();
            } else {
                this._currentPlayButtonUpdate(true);
            }
            

        } else {
            this._currentPlayButtonUpdate(false);
        }

        this._drawUserProgress(user.rect.left, user.rect.width, user.rect.top, user.rect.height)
    },

    handleBet:function(data)
    {

        var arrayInfo = data.class.split(",");
        var betTypeName = arrayInfo[0]  // 下注类型
        var betvalue = parseInt(arrayInfo[1]) // 本局下注总数
        var chips = parseInt(arrayInfo[2]) // 手上剩余筹码数

        var user = this._userByUserID(data.from)
        user.setParam(null, null, chips, null)
        var betType = this._betTypeByBetTypeNames(betTypeName)

        this.currentBet = betvalue
        this.currentBetType = betType
     
        switch(betType){
            case this.CONST.BetType_ALL:
            case this.CONST.BetType_Call:
            case this.CONST.BetType_Raise: {
                if (user) {
                    user.setUseCoin(betvalue);
                    if (user.param.userID == userID) {
                        this.chips = chips;
                        this.gameStateObj.mybetOnDesk = betvalue
                    };
                } else {
                    console.log("ERROR: can't find user, userid:",data.from);
                }

                if(betType == this.CONST.BetType_Raise) {
                    // 当 raise 后 wait button 发生变化

                    //跟注或看牌，取消掉
                    if(this.waitSelected2 === true) {
                        this.waitOnClick2()
                    }
                }

            }
            break;
            //弃牌
            case this.CONST.BetType_Fold:
                user.setGiveUp(true);
                if (user.param.userID == userID) {
                    this._resetGameRoundStatus()
                }
                break;
            //看牌
            case this.CONST.BetType_Check:
                break;
            default:
                console.log("ERROR: betType not a vaid value:",betType);
                break;
        }


    },

    handleShowDown:function(data)
    {
        console.log("showdown:",data);
        this._stopDrawUserProgress();

        var roomInfo = data.room;
        var playerList = roomInfo.occupants;

        var maxHand = 0
        var maxHandIndex = 0

        // 如果都没有hand说明只有一个人下注，没有翻牌的情况
        var lastHasCardsIndex = -1; //保存最后一个出牌的人index
        var hashand = false;

        for (var i = playerList.length - 1; i >= 0; i--) {
            var occupantInfo = playerList[i]

            if(!occupantInfo) {
                continue;
            }

            if (occupantInfo.cards) {
                lastHasCardsIndex = i 
            }

            if (occupantInfo.hand) {
                hashand = true
            }


            var hand = occupantInfo.hand
            if (maxHand < hand) {
                maxHand = hand
                maxHandIndex = i
            }
        };

        //只有一个人下注，没有翻牌的情况
        if (!hashand && lastHasCardsIndex!=-1) {
           maxHandIndex = lastHasCardsIndex
        } 

        var winOccupantItem = playerList[maxHandIndex]

        if (winOccupantItem != undefined && winOccupantItem != null) {
            var winUser = this._userByUserID(winOccupantItem.id)
                if (winOccupantItem.action != "fold") {
                    if(winOccupantItem.cards != null && winOccupantItem.cards != undefined) {
                        winUser.setWinCard(winOccupantItem.cards[0], winOccupantItem.cards[1]);
                        var hand = winOccupantItem.hand;
                        if(hand != undefined && hand != null) {
                            var type = (hand >>> 16)
                            if(type > 10) {
                                type = 0
                            }

                            if(winOccupantItem.id != this.userID) {
                                winUser.setUserTitle(this.CONST.CardTypeNames[type])
                            }

                        }
                    }

            }
        }
    },

    handleState:function(data)
    {
        var roomInfo = data.room;
        var playerList = roomInfo.occupants;

        this.roomID = roomInfo.id;
        this.bb = roomInfo.bb;
        this.sb = roomInfo.sb;
        this.blinds.setText("$" + this.sb + " / $" + this.bb);
        //this.currentBettinglines = roomInfo.bet;
        this.timeoutMaxCount = roomInfo.timeout;
        var publicCards = roomInfo.cards;
        if(!publicCards)
        {
            publicCards = [];
        }
        //初始化公共牌
        var lstCardID = [];
        var lstCardImage = [];
        for(var i = 0; i < publicCards.length; i++)
        {
            this.publicCards[i].visible = true;
            this.publicCards[i].loadTexture(publicCards[i], this.publicCards[i].frame);
        }
        for(var i = publicCards.length; i < this.publicCards.length; i++)
        {
            this.publicCards[i].visible = false;
            this.publicCards[i].loadTexture("cardBK", this.publicCards[i].frame);
        }

        //初始化筹码池
        var chipPoolCount = 0;

        if(!roomInfo.pot) {
            roomInfo.pot = []
        }

        for(var i = 0; i < roomInfo.pot.length; i++)
        {
            chipPoolCount += roomInfo.pot[i];
        }
        this.chipPool.setText(chipPoolCount);
        this.gameStateObj.bankerPos = roomInfo.button;

        //初始化玩家
        var occupants = roomInfo.occupants;
        for (var i = 0; i < this.userList.length; i++)
        {
            var user = this.userList[i];
            //user.setParam(null, "defaultUserImage", "");
            user.setParam(null, null, "");
        }
        //计算座位偏移量，以自己为5号桌计算
        var playerOffset = 0;
        for(var i = 0; i < occupants.length; i++)
        {
            var userInfo = occupants[i];
            if(userInfo && userInfo.id == userID)
            {
                playerOffset = (this.userList.length - 1) / 2 - userInfo.index;
                this.chips = userInfo.chips
                break;
            }
        }
        for(var i = 0; i < occupants.length; i++)
        {
            var userInfo = occupants[i];
            if(!userInfo)
            {
                continue;
            }
            var index = userInfo.index + playerOffset;
            if(index >= this.userList.length)
            {
                index -= this.userList.length;
            }
            else if(index < 0)
            {
                index += this.userList.length;
            }
            var user = this.userList[index];
            if(userInfo.profile && userInfo.profile != "")
            {
                game.load.image("userImage" + index, userInfo.profile, true);
                game.load.start();
            }
            user.setParam(userInfo.name, userInfo.profile, userInfo.chips, (userInfo.id == userID));
            user.param.seatNum = userInfo.index;
            user.param.userID = userInfo.id;
            user.setVisable(true);
        }
    },


    // ulitiy function
/*
    _betTypeByBet:function(bet) {
        var betType = 0
        if(bet < 0) {
            betType = this.CONST.BetType_Fold
        } else if(bet == 0) {
            betType = this.CONST.BetType_Check
        } else if(bet == this.gameStateObj.bet) {
            betType = this.CONST.BetType_Call
        } else if(bet > this.gameStateObj.bet) {
            betType = this.CONST.BetType_Raise
        } else if(bet == this.gameStateObj.chips) {
            betType = this.CONST.BetType_ALL
        } else {
            console.log("error bet value :", bet);
        }
        return betType
    },
    */


    _betTypeByBetTypeNames:function(name) {
        for (var i = this.CONST.BetTypeNames.length - 1; i >= 0; i--) {
            if (this.CONST.BetTypeNames[i] == name) {
                return i;
            }
        };
        return -1;
    },

    _userByUserParam:function(key, value) {
        for (var i =0;  i < this.userList.length;  i++) {
            var obj = this.userList[i];
            if (obj.param[key] == value) {
                return [obj, i];
            }
        }
        return null
    },

    _userByUserID:function(userid) {
        var ret = this._userByUserParam("userID", userid)
        if(ret) {
            return ret[0]
        }
        return null
    },

    _userBySeatNum:function(seatnum) {
        var ret = this._userByUserParam("seatNum", seatnum)
        if(ret) {
            return ret[0]
        }
    },

    _userIndexBySeatNum:function(seatnum) {
        var ret = this._userByUserParam("seatNum", seatnum)
        if(ret) {
            return ret[1]
        }
        return -1;
    },


    _currentPlayButtonUpdate:function(isCurrentPlayer) {
        this._setWaitButtonsVisible(!isCurrentPlayer)
        this._setBetButtonsVisible(isCurrentPlayer);
    },

    _drawUserProgress:function(left, width, top, height) {
        this._stopDrawUserProgress()

        this.animation.showLight(left + width / 2, top + height / 2);
        this.drawRectAnime.clean();
        this.drawRectAnime.setpara(left, top, width, height, 8 * this.scale, this.timeoutMaxCount);
        this.drawRectAnime.setLineWidth(5 * this.scale);

        var that = this; 
        this.drawRectAnime.draw(function(){
            var user = that._userBySeatNum(that.gameStateObj.playerSeatNum)
            if(user.param["userid"] == that.userID) {
                that.animation.showShake(that.selfCards[0]);
                that.animation.showShake(that.selfCards[1]);
            }

        });
    },

    _stopDrawUserProgress:function() {
        // draw time progress
        if(this.drawRectAnime.isPainting)
        {
            this.drawRectAnime.stop();
        }

        this.drawRectAnime.clean();
    },

    _initNewRound:function() {
        for (var i =0;  i < this.userList.length;  i++) {
            var user = this.userList[i]
            if (user.param.seatNum != -1) {
                console.log("=====UserName:", user.param.userName);
                if((!user.param.userName) || 
                    user.param.userName == null) {
                    console.log("initNewRound null username");
                }
            };
            user.reset()
        }

       this._clearWaitButtons();
       this._setBetButtonsVisible(false);
       this._setWaitButtonsVisible(false);
       this._resetGameRoundStatus();
       this._resetPublicCard();
       this._clearChipPoolCoins();

       this.gameStateObj.mybet = this.bb
       this.chipPool.setText("0");
       this.autoCall = 0;
    },

    _clearWaitButtons:function() {
        this.waitSelected1 = false;
        this.waitSelected2 = false;
        this.waitSelected3 = false;

        this.lbCallWait.setText("跟注");
        this.lbLookorGiveupWait.setText("看牌或弃牌")
        this.lbCallEveryWait.setText("跟所有注")

        this._betWaitButtonCheckOn(this.imgLookorGiveupWait, false);
        this._betWaitButtonCheckOn(this.imgCallWait, false);
        this._betWaitButtonCheckOn(this.imgCallEveryWait, false);
    }, 

    _setBetButtonsVisible: function(blVisible) {
        this.buttonGroup1.visible = blVisible;
        this.buttonGroup2.visible = blVisible;
        this.buttonGroup3.visible = blVisible;

        if(blVisible == false) {
            this.chipboxGroup.visible = false;
        }

    },

    _setWaitButtonsVisible:function(blVisible) {
        this.waitButtonGroup1.visible = blVisible;
        this.waitButtonGroup2.visible = blVisible;
        this.waitButtonGroup3.visible = blVisible;
    },

    _disconnectReset:function() {
        for (var i =0;  i < this.userList.length;  i++) {
            this.userList[i].clean();
        }

        if(this.light)
        {
            this.light.visible = false;
        }
        // TOD Reconnect...
    },

    _autoAction:function() {
        // 看或弃牌
        var user = this._userByUserID(userID)

        if (this.waitSelected1) {
            this.actionOnClick1()
            this.waitSelected1 = false;
        // 自动看牌/自动跟注
        } else if(this.waitSelected2) {
            this.actionOnClick2()
            this.waitSelected2 = false;
        // 跟任何注
        } else if(this.waitSelected3) {
            //this.actionOnClick3()
            var bet = this.currentBet - this.gameStateObj.mybetOnDesk
            if(bet > this.chips) {
                bet = this.chips;
            }

            this._raseAction(bet)
            this.waitSelected3 = false;
        }

        this._clearWaitButtons();
        this._setWaitButtonsVisible(false);
    },

    _resetGameRoundStatus:function() {
        this.gameStateObj.mybet = 0;     //当前玩家需要下注额下
        this.gameStateObj.mybetOnDesk = 0;
    },

    _flopAnimation:function(card1, card2, card3) {
        var deskCardIDs = []
        //var arrayCards = data.class.split(",");
        //var publicCards = [arrayCards[0], arrayCards[1], arrayCards[2]];
        var publicCards = [card1, card2, card3];

        var lstCardImage = [];
        for (var i = 0; i < publicCards.length; i++) {
            this.animation.publicCards[i].visible = true;
            deskCardIDs.push(i);
            lstCardImage.push(publicCards[i]);
        }
        this.animation.showPublicCard(deskCardIDs, lstCardImage, true);
    },

    _turnAnimation:function(card) {
        //this.animation.publicCards.push(card)

        var deskCardIDs = [3]
        var lstCardImage = [card]
        this.animation.publicCards[deskCardIDs].visible = true;
        this.animation.showPublicCard(deskCardIDs, lstCardImage, false);
    },

    _riverAnimation:function(card) {
        //this.animation.publicCards.push(card)

        var deskCardIDs = [4]
        var lstCardImage = [card]
        this.animation.publicCards[deskCardIDs].visible = true;
        this.animation.showPublicCard(deskCardIDs, lstCardImage, false);
    },

    _resetPublicCard:function() 
    {
        for(var i = 0; i < this.publicCards.length; i++)
        {
            this.publicCards[i].visible = false;
            this.publicCards[i].loadTexture("cardBK", this.publicCards[i].frame);
        }
        for(var i = this.publicCards.length; i < this.publicCards.length; i++)
        {
            this.publicCards[i].visible = false;
            this.publicCards[i].loadTexture("cardBK", this.publicCards[i].frame);
        }
    },

    _setSliderRange:function(minNum, maxNum)
    {
        if(minNum != undefined)
        {
            this.sliderMinNum = minNum;
        }
        if(maxNum != undefined)
        {
            this.sliderMaxNum = maxNum;
        }

        this.chipboxTextSlider.setText(this.sliderMinNum);
        this.chipboxSliderHandle.y = this.chipboxSliderGroove.y + this.chipboxSliderGroove.height * 0.5 - this.chipboxSliderHandle.height * 0.5;
    },

    _setSliderValue:function(value) {
        this.chipboxTextSlider.setText(value);
        this.chipboxSliderHandle.y = this.chipboxSliderGroove.y + this.chipboxSliderGroove.height * 0.5 - this.chipboxSliderHandle.height * 0.5;
    },

    _betWaitButtonCheckOn:function(buttonCheckImage, blOn)
    {
        var imgid = blOn?"checkOn":"checkOff";
        buttonCheckImage.loadTexture(imgid, buttonCheckImage.frame);
    },

    _betWaitButtonChecked:function() 
    {
        return this.waitSelected1 || this.waitSelected2 || this.waitSelected3
    },

    _setBetCardType:function(cardType) {
        var carTypeName = this.CONST.CardTypeNames[parseInt(cardType)]
        var user = this._userByUserID(userID)
        user.setUserTitle(carTypeName);
    },

    _clearChipPoolCoins:function() {
        for (var i = this.chipPoolCoins.length - 1; i >= 0; i--) {
            this.chipPoolCoins[i].destroy()
        }

        this.chipPoolCoins = []
    },

    _updatePoolChipValue:function(minChip) {

        //this.gameStateObj.chipboxValue1 = minChip;
        //this.gameStateObj.chipboxValue2 = minChip * 2;
        //this.gameStateObj.chipboxValue3 = minChip * 4;

        var chip1 = minChip;
        var chip2 =  chip1 * 2;
        var chip3 = chip2 * 2;
        this.gameStateObj.chipboxValue1 = chip1;
        this.gameStateObj.chipboxValue2 = chip2;
        this.gameStateObj.chipboxValue3 = chip3;


        this.chipboxText4.setText(chip1);

        this.chipboxText3.setText(chip2);

        this.chipboxText2.setText(chip3);

        if(chip3 >= this.chips) {
            this.chipboxButton2.visible = false;
            this.chipboxText2.visible = false;
        } else {
            this.chipboxButton2.visible = true;
            this.chipboxText2.visible = true;
        }

        if(chip2 >= this.chips) {
            this.chipboxButton3.visible = false;
            this.chipboxText3.visible = false;
        } else {
            this.chipboxButton3.visible = true;
            this.chipboxText3.visible = true;
        }

        if(chip1 >= this.chips) {
            this.chipboxButton1.visible = false;
            this.chipboxText1.visible = false;
        } else {
            this.chipboxButton1.visible = true;
            this.chipboxText1.visible = true;
        }

    },

    _resetPool:function() {
        _updatePoolChipValue(this.bb)
    },
    _isCurrentUser:function() {

        var user =   this.userID
        return 
    }
};

/*
game.betApi = new BetApi();

game.state.add("LoginState", LoginState);
game.state.add("MainState", MainState);
game.state.start("LoginState");
*/
