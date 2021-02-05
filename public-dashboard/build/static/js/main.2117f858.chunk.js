(this["webpackJsonpsocket-io-client"]=this["webpackJsonpsocket-io-client"]||[]).push([[0],{105:function(e,t,n){},162:function(e,t,n){},163:function(e,t,n){"use strict";n.r(t);var c=n(28),a=n(1),r=n.n(a),o=n(11),s=n.n(o),i=n(37);n(54);var u=n(15),l=n(9),d=n(6),j=(n(55),n(3)),b=function(){var e=r.a.useState(""),t=Object(d.a)(e,2),n=t[0],c=t[1],a=r.a.useState(""),o=Object(d.a)(a,2),s=o[0],i=o[1],l=r.a.useState(""),b=Object(d.a)(l,2),O=b[0],p=b[1];return Object(j.jsxs)("div",{className:"home-container",children:[Object(j.jsx)("input",{type:"text",placeholder:"Room",value:n,onChange:function(e){c(e.target.value)},className:"text-input-field"}),Object(j.jsx)("input",{type:"text",placeholder:"User ID",value:s,onChange:function(e){i(e.target.value)},className:"text-input-field"}),Object(j.jsx)("input",{type:"text",placeholder:"User Name",value:O,onChange:function(e){p(e.target.value)},className:"text-input-field"}),Object(j.jsx)(u.b,{to:"/".concat(s,"/").concat(n),className:"enter-room-button",children:"Join room"})]})},O=void 0,p=(Object(i.a)(null,{setUserId:function(e){return{type:"userId",payload:{userId:e}}},setUserName:function(e){return{type:"userName",payload:{userName:e}}}})((function(){var e=r.a.useState(""),t=Object(d.a)(e,2),n=t[0],c=t[1],a=r.a.useState(""),o=Object(d.a)(a,2),s=o[0],i=o[1];return Object(j.jsxs)("div",{className:"home-container",children:[Object(j.jsx)("input",{type:"text",placeholder:"User ID",value:n,onChange:function(e){c(e.target.value)},className:"text-input-field"}),Object(j.jsx)("input",{type:"text",placeholder:"User Name",value:s,onChange:function(e){i(e.target.value)},className:"text-input-field"}),Object(j.jsx)("button",{className:"add-todo",onClick:function(){O.props.setUserId(O.state.userName),O.props.setUserName(O.state.userName)},children:"Login"}),Object(j.jsx)(u.b,{to:"/rooms",className:"enter-room-button",children:"Join room"})]})})),n(105),n(40)),m=n(39),f=n.n(m),h={NEW_GAME:"gameCreated",PLAY_CONFIRM:"playConfirm",START_GAME:"start",PLAYER_INACTIVE:"playerInactive",LOGGED_IN:"userLoggedIn",CHAT_MESSAGE:"newChatMessage",BROADCAST_PLAYER_JOINED:"playerJoined",BROADCAST_PLAYER_REJOINED:"playerRejoined",BROADCAST_PLAYER_DROPPED:"playerDropped",BROADCAST_PLACE_COIN:"placeCoin",BROADCAST_REMOVE_COIN:"removeCoin",BROADCAST_REPLACE_CARD:"replaceCard"},g=function(e,t){var n=Object(a.useState)([]),r=Object(d.a)(n,2),o=r[0],s=r[1],i=Object(a.useRef)();Object(a.useEffect)((function(){return i.current=f()("http://localhost:8081",{query:{playerId:t,gameId:e}}),Object.values(h).forEach((function(e){i.current.on(e,(function(t){var n={body:JSON.stringify({msg:e,body:JSON.stringify(t)}),ownedByCurrentUser:!1};s((function(e){return[].concat(Object(p.a)(e),[n])}))}))})),i.current.on("newChatMessage",(function(e){var t=Object(c.a)(Object(c.a)({},e),{},{ownedByCurrentUser:e.senderId===i.current.id});s((function(e){return[].concat(Object(p.a)(e),[t])}))})),i.current.on("error",(function(e){var t={body:JSON.stringify(e),ownedByCurrentUser:!0};s((function(e){return[].concat(Object(p.a)(e),[t])}))})),function(){i.current.disconnect()}}),[e]);return{messages:o,sendMessage:function(e){var t=e.indexOf(" ");i.current.emit(e.substr(0,t),JSON.parse(e.substr(t+1)))}}},x=function(e){var t=e.match.params,n=t.gameId,c=t.playerId,a=g(n,c),o=a.messages,s=a.sendMessage,i=r.a.useState(""),u=Object(d.a)(i,2),l=u[0],b=u[1];return Object(j.jsxs)("div",{className:"chat-room-container",children:[Object(j.jsxs)("h1",{className:"room-name",children:["Room: ",n]}),Object(j.jsx)("div",{className:"messages-container",children:Object(j.jsx)("ol",{className:"messages-list",children:o.map((function(e,t){return Object(j.jsx)("li",{className:"message-item ".concat(e.ownedByCurrentUser?"my-message":"received-message"),children:e.body},t)}))})}),Object(j.jsx)("textarea",{value:l,onChange:function(e){b(e.target.value)},placeholder:"Write message...",className:"new-message-input-field"}),Object(j.jsx)("button",{onClick:function(){s(l),b("")},className:"send-message-button",children:"Send"})]})},v=(n(164),n(24)),y=n.n(v),C=n(171),N=n(172),S=n(173),I=n(174),A=n(21),E=n(89),R=n.n(E),D=(n(162),"playConfirm"),_="player_reconnected",w="start",B="playerInactive",T="playerJoined",J="playerRejoined",k="coinAction";var L=function(e,t){var n=Object(A.d)(),c=function(){for(var e=[],t=0;t<10;t++)e[t]=[];var n=["S","D","C","H"],c=["2","3","4","5","6","7","8","9","0","Q","K","A"],a={S:c,D:c,C:[].concat(c).reverse(),H:[].concat(c).reverse()},r=0,o=0,s=0,i=1,u=0,l=0;y.a.set(e,[0,0],"*"),y.a.set(e,[9,9],"*"),y.a.set(e,[0,9],"*"),y.a.set(e,[9,0],"*");for(var d=0;d<100;d++){if(!e[s][i]){var j=n[r],b=a[j][o];11===o&&(r=(r+1)%4),o=(o+1)%12,y.a.set(e,[s,i],"".concat(b).concat(j))}switch(u){case 0:i===9-l?(s++,u++):i++;break;case 1:s===9-l?(u++,i--):s++;break;case 2:i===l?(s--,u++,l++):i--;break;case 3:s===l?(i++,u=0):s--}}return e}(),r=Object(a.useState)(0),o=Object(d.a)(r,2),s=o[0],i=o[1],u=Object(a.useState)(0),l=Object(d.a)(u,2),j=l[0],b=l[1],O=Object(a.useState)([]),p=Object(d.a)(O,2),m=p[0],h=p[1],g=Object(a.useState)([]),x=Object(d.a)(g,2),v=x[0],C=x[1],N=Object(a.useState)([]),S=Object(d.a)(N,2),I=S[0],E=S[1],R=Object(a.useState)([]),L=Object(d.a)(R,2),P=L[0],M=L[1],U=Object(a.useState)([]),H=Object(d.a)(U,2),F=H[0],G=H[1],Y=Object(a.useRef)();function q(e){h({globalBoard:c,board:e})}function V(e){var t=e.hand;e.turn;C(t)}function W(e){E(e);var n=e.findIndex((function(e){return e.playerId===t}));n&&i(n)}function K(e){var t=e.players,n=e.history,c=e.turn;void 0!==c&&b(c),M(n),W(t)}function Q(e){var t=e.turn,n=e.history,c=e.board;b(t),q(c),M(n)}function z(e){var t=e.board,n=e.hand,c=e.players,a=e.history,r=e.turn;q(t),M(a),C(n),b(r),W(c)}Object(a.useEffect)((function(){return Y.current=f()("https://evening-lowlands-19146.herokuapp.com/",{query:{playerId:t,gameId:e}}),Y.current.on(w,z),Y.current.on(_,z),Y.current.on(D,V),Y.current.on(k,Q),Y.current.on(T,K),Y.current.on(J,K),Y.current.on(B,K),Y.current.on("error",(function(e){var t=e.err;console.log("Error: ".concat(t)),n.show(t)})),function(){Y.current.disconnect()}}),[e]);return{board:m,hand:v,setHand:C,players:I,errors:F,setErrors:function(e){G(e),setTimeout((function(){G((F||[]).filter((function(e){var t=e.time;return Date.now()-t<3e3})))}),3e3)},history:P,turn:j,position:s,placeAction:function(e,t){Y.current.emit("play",{card:e,position:t})},replaceCard:function(e){Y.current.emit("play",{card:e,action:"replace"})}}},P={0:"red.png",1:"green.png",2:"blue.png"};function M(e){var t="".concat(e,".png");return"AD.png"===t&&(t="aceDiamonds.png"),"*.png"===t&&(t="back2x.png"),t}var U=["JS","JH"],H=["JD","JC"];var F=function(e){var t=Object(A.d)(),n=e.match.params,c=n.gameId,a=n.playerId,o=L(c,a),s=o.board,i=o.hand,u=o.setHand,l=(o.players,o.position),b=(o.errors,o.setErrors,o.history,o.turn),O=o.placeAction,p=(o.globalBoard,o.replaceCard),m=r.a.useState(""),f=Object(d.a)(m,2),h=f[0],g=f[1],x=r.a.useState(""),v=Object(d.a)(x,2),y=v[0],E=v[1],D=r.a.useState(!1),_=Object(d.a)(D,2),w=_[0],B=_[1];var T=function(e,n,c){return l!==b?(console.log("Not your turn"),void t.show("Not your turn")):h?(a=h,U.includes(a)||function(e){return H.includes(e)}(h)||h===c?(O(h,"".concat(e,"-").concat(n)),void g(null)):(console.log("Not the selected card"),void t.show("Not the selected card"))):(console.log("No Card Selected"),void t.show("No Card Selected"));var a};function J(e){return y===e}function k(){B(!1)}return Object(j.jsxs)(C.a,{children:[Object(j.jsxs)(R.a,{isOpen:w,onRequestClose:k,contentLabel:"Example Modal",children:[Object(j.jsx)("h2",{children:"Replace card?"}),Object(j.jsx)("button",{onClick:function(){p(h),B(!1)},children:"yes"}),Object(j.jsx)("button",{onClick:k,children:"no"})]}),Object(j.jsxs)(N.a,{children:[Object(j.jsx)(S.a,{children:Object(j.jsxs)("span",{children:["Turn: ",b]})}),Object(j.jsx)(S.a,{children:Object(j.jsxs)("span",{children:["Position: ",l]})}),Object(j.jsx)(S.a,{children:Object(j.jsxs)("span",{children:["Selected: ",h]})})]}),Object(j.jsx)(N.a,{children:Object(j.jsx)(C.a,{fluid:!0,className:"container",children:(s.globalBoard||[]).map((function(e,t){return Object(j.jsx)(N.a,{children:e.map((function(e,n){var c=function(e,t,n){var c=e&&e.selectedPositions["".concat(t,"-").concat(n)];return void 0!==c&&"*"!==c&&"/img/coins/"+P[c]}(s.board,t,n);return Object(j.jsx)(S.a,{children:Object(j.jsxs)(I.a,{onClick:function(){return T(t,n,e)},children:[Object(j.jsx)(I.a.Img,{alt:"Card","img-border-primary":!0,src:"".concat("","/img/").concat(M(e))}),c&&Object(j.jsx)("img",{src:c,className:"coin img-responsive"})]})})}))},"row".concat(t))}))})}),Object(j.jsx)(N.a,{children:Object(j.jsx)(C.a,{fluid:!0,children:Object(j.jsx)(N.a,{style:{justifyContent:"center",padding:"20px"},children:(i||[]).map((function(e,t){return Object(j.jsx)(S.a,{children:Object(j.jsx)("img",{alt:"Card1",height:"100vh",src:"".concat("","/img/").concat(M(e)),class:J(t)?"border border-primary":"",onClick:function(){return function(e,t){g(e),E(t),s.board.selectedByIndex[e]>1&&B(!0),u(i)}(e,t)}})})}))})})})]})};var G=function(){return Object(j.jsx)(u.a,{children:Object(j.jsxs)(l.c,{children:[Object(j.jsx)(l.a,{exact:!0,path:"/",component:b}),Object(j.jsx)(l.a,{exact:!0,path:"/rooms",component:b}),Object(j.jsx)(l.a,{exact:!0,path:"/:playerId/:gameId",component:F}),Object(j.jsx)(l.a,{exact:!0,path:"/chat/:playerId/:gameId",component:x})]})})},Y=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,175)).then((function(t){var n=t.getCLS,c=t.getFID,a=t.getFCP,r=t.getLCP,o=t.getTTFB;n(e),c(e),a(e),r(e),o(e)}))},q=n(90),V={position:A.b.BOTTOM_CENTER,timeout:5e3,offset:"30px",transition:A.c.SCALE},W=Object(j.jsx)(A.a,Object(c.a)(Object(c.a)({template:q.a},V),{},{children:Object(j.jsx)(r.a.StrictMode,{children:Object(j.jsx)(G,{})})}));s.a.render(W,document.getElementById("root")),Y()},54:function(e,t,n){},55:function(e,t,n){}},[[163,1,2]]]);
//# sourceMappingURL=main.2117f858.chunk.js.map