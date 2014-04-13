var ONION = {
  layouts: {
    headerHeight: 170,
    contentRowHeight: 80,
    barcodeRowHeight: 430,
    infoRowHeight: 430
  },
  debug: true,
  apis: ['api/fetch_from_bbs.php', 'api/fetch_from_weibo_at.php'],
  maxItems: 40
};
(function ($) {
  $(document).ready(function () {
    var message = function (msg) {
      if (ONION.debug) {
        $('#cover').text(msg);
      }
      console.log(msg);
    }
    message('初始化……');
    //初始化 flow 的高度
    var initFlowHeight = function () {
      var windowHeight = $(window).height();
      var flowHeight = $('#flow').height(windowHeight - ONION.layouts.headerHeight).height();
      //console.log(0.5 * (flowHeight - ONION.layouts.barcodeRowHeight));
      $('#barcode-row').css('padding-top', 0.5 * (flowHeight - ONION.layouts.barcodeRowHeight) + 'px');
      $('#info-row').css('padding-top', 0.5 * (flowHeight - ONION.layouts.infoRowHeight) + 'px');
    };
    initFlowHeight();
    //当窗口变动时依然保持 flow 窗口高度
    $(window).on('resize', function () {
      initFlowHeight();
    });
    //调整内容尺寸，自动填充
    var adjustContentSize = function (content) {
      var content = $(content);
      var adjustFontSize = false;
      while (content.height() < ONION.layouts.contentRowHeight) {
        adjustFontSize = parseInt(content.css('font-size')) + 1;
        content.css('font-size', adjustFontSize + 'px');
        if (adjustFontSize > 80) return; //不要太大
      }
      if (adjustFontSize) {
        //往回切一格保证字体比contentRowHeight小
        content.css('font-size', adjustFontSize - 1 + 'px');
      }
    };
    ONION.addContent = function (name, avatar, content) {
      var rowDom = $('#templateRow').clone()[0]; //复制一个神奇的dom
      rowDom.id = "row-" + Math.random();
      $(rowDom).addClass('data-row');
      $(rowDom).find('.avatar img').attr('src', avatar);
      $(rowDom).find('.content .name').html(name);
      $(rowDom).find('.content .message').html(content);
      $('#flow').prepend(rowDom);
      adjustContentSize($(rowDom).find('.content'));
      $(rowDom).hide();
      $(rowDom).slideDown();
      //检查元素数量
      var datarows = $('.data-row');
      if (datarows.length > ONION.maxItems) {
        message('冗余数据清理启动。');
        for (var i = datarows.length - 1; i >= ONION.maxItems; i--) {
          $(datarows[i]).remove();
        }
        ;
      }
    };
    //右上角轮换
    var slide = function () {
      var firstDom = $('#tips span:first');
      $('#tips').append(firstDom.clone());    //循环加回列表
      firstDom.slideUp(function () {
        firstDom.remove();  //节约dom
      });
    };
    setInterval(slide, 5000);
    //上下滚动
    var scroll = function (step) {
      return function () {
        var flow = $('#flow'), top = flow.scrollTop() + step;
        flow.scrollTop(top);
        top = flow.scrollTop();
        $('#ctrl-scroll-up').css('top', top);
        $('#flow .information').css('top', top);
        $('#ctrl-scroll-down').css('bottom', 0 - top);
      }
    };
    $('#ctrl-scroll-up').mouseenter(function () {
      stepUp = 0;
      var id = setInterval(scroll(-8), 1);
      $(this).mouseleave(function () {
        clearInterval(id);
      })
    });
    $('#ctrl-scroll-down').mouseenter(function () {
      stepUp = 0;
      var id = setInterval(scroll(8), 1);
      $(this).mouseleave(function () {
        clearInterval(id);
      })
    });
    //控制菜单
    $('#ctrl-show-barcode').mouseenter(function () {
      $('#barcode-row').fadeIn();
    }).mouseleave(function () {
      $('#barcode-row').fadeOut();
    });
    $('#ctrl-show-info').mouseenter(function () {
      $('#info-row').fadeIn();
    }).mouseleave(function () {
      $('#info-row').fadeOut();
    });
    $('#ctrl-show-lottery').mouseenter(function () {
      $('#lottery-row').fadeIn();
    }).mouseleave(function () {
      if (!$('#lottery-row').hasClass('locked')) {
        $('#lottery-row').fadeOut();
      }
    }).click(function () {
      if ($('#lottery-row').hasClass('locked')) {
        $('#lottery-row').removeClass('locked');
      } else {
        $('#lottery-row').addClass('locked')
      }
    });
    // 绑定抽奖函数
    var rollUsers = {};
    var rollcount = 0;
    var rollInterval;

    var awardList = [];
    var roll = function () {
      if (typeof rollInterval === 'undefined') {
        rollcount++;
        rollInterval = setInterval(function () {
          var users = [];

          $('#lottery-roll-count').html(rollcount);

          for (key in rollUsers) users.push(key);

          // 随机挑选一个用户
          var current = '';
          while (true) {
            current = users[parseInt(Math.random() * (users.length))];

            // 该用户未显示在抽奖区上，且该用户不在已中奖用户的列表上时，才将其显示在抽奖区上
            if (current != $('#lottery-username').html() && awardList.indexOf(current) == -1) {
              break;
            }
          }

          $('#lottery-users-count').html(users.length - awardList.length);
          $('#lottery-avatar').attr('src', rollUsers[current]);
          $('#lottery-username').html(current);
        }, 100);
      } else {
        clearInterval(rollInterval);
        rollInterval = undefined;

        var current = $('#lottery-username').html();
        // 添加到中奖名单中
        $('#award-list').append('<div class="award-user"><img src="' + rollUsers[current] + '">' + current + '</div>');
        awardList.push(current);
      }
    };

    $(document).keypress(function (e) {
      if (e.which == 32 && $('#lottery-row').hasClass('locked')) {
        roll();
      }
    });
    //锁定解锁
    $('#locker').click(function () {
      if ($(this).hasClass('fa-unlock')) {
        $(this).addClass('fa-lock').removeClass('fa-unlock');
        $('#cover').show();
      } else {
        $(this).addClass('fa-unlock').removeClass('fa-lock');
        $('#cover').hide();
      }
    });
    //更新
    var since_id = 0;
    var itemList = [];
    var updateIntval = false;
    //后端抓取cron（误）
    var updateApis = function () {
      for (var i = ONION.apis.length - 1; i >= 0; i--) {
        (function (i) {
          setTimeout(function () {
            message('刷新后台数据……');
            $.get(ONION.apis[i], function (msg) {
              message(msg);
            });
          }, i * 2000);  //自动延时操作
        })(i);
      }
      ;
    };
    setInterval(updateApis, 30 * 1000);
    var insertWeibo = function () {
      var item = itemList.pop();
      if (item) {
        ONION.addContent(item.name, item.avatar, item.message);
      }
      //锁定状态下才滚动
      if ($('#locker').hasClass('fa-lock')) {
        $('#flow').scrollTop(0);
      }
    };
    setInterval(insertWeibo, 5000);
    ONION.updateWeibo = (function () {
      message('更新数据……');
      $.get('api/list.php?since_id=' + since_id, function (data) {
        console.log(rollUsers);
        if (data.err_msg != 'success') {
          clearInterval(updateIntval);
          alert(data.err_msg || data);
          window.location.refresh();
          return;
        }
        //正序循环，因为要插入微博墙
        for (var i = 0; i < data.items.length; i++) {
          var item = data.items[i];
          if(item.name.match(/(学工|学生工作|^云麓谷$|^中国(高校|大学)|^中南|云麓园(bbs|BBS)$|大学|学院)/)){
            continue;
          }
          rollUsers[item.name] = item.avatar;
          if (!since_id) {
            //首次请求，直接塞入微博
            //第一次仅塞前几条就好
            if (data.items.length - i < 5) {
              ONION.addContent(item.name, item.avatar, item.message);
            }
          } else {
            itemList.push(item);
            if(itemList.length>30){
              //堆积了微博
              setTimeout(insertWeibo,100*i);
            }
          }
        }
        if (data.max_id) {
          since_id = data.max_id;
        }
        message('载入' + data.items.length + '条，现存共' + since_id + '条。');
      });
    });
    updateIntval = setInterval(ONION.updateWeibo, 10000);
    ONION.updateWeibo();
  });
})(jQuery);