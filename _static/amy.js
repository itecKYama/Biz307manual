$(function () {
  /**
   * メニューの表示非表示の状態を保管するクッキーのキーです。
   * 表示の場合はshow、非表示の場合はhideです。
   */
  var MENU_COOKIE_KEY = 'biz-document-library-menu';

  /**
   * ヘッダーやナビなどの固定された領域を考慮して、コンテンツを表示させる際のオフセットのトップです。
   * この値は、レイアウト（common.lessのヘッダーの高さ+ナビの高さ+ツールバーの高さ）から決まります。
   */
  var OFFSET_TOP = -140;

  $(document).ready(function () {
    adjustDisplayPositionFromExternalLink();
    adjustMenu();
    toggleDisplayOfMenu();
    toggleDisplayOfPartnerSiteLink();

    // IE11などの「display:sticky」に対応していないブラウザー向けのPollyfillです。
    Stickyfill.add($('.sticky'));
  });

  $('a').click(function (e) {
    var _href = $(this).attr('href');
    if (_href && _href !== '#' && _href.indexOf('#') == 0 && $(this).hasClass('footnote-reference')) {
      var $id = $(_href.replace(/(:|\.|\[|\]|\(|\))|,/g, "\\$1"));
      setTimeout(function () {
        $(document).scrollTop($id.position().top + OFFSET_TOP);
        $('html, body').animate({ scrollTop: $id.position().top + OFFSET_TOP }, 100, 'swing');
      }, 1);
      return;
    }
    // 選択されたメニューをページ内リンクから導出します。導出できない場合は、「#」でトップになります。
    var $selectedMenu = $("div.sidebar a[href='" + _href + "']");
    if ($selectedMenu.length == 0) {
      $selectedMenu = $("div.sidebar a[href='#']");
    }
    addClassMenuNodeAndParentNodeAsCurrent($selectedMenu);
  });

  $('div.sidebar ul.current').on('click', 'li', function (e) {
    if (this == e.target.parentNode) {
//      $('ul .current').each(function (i, node) {
//        $(node).removeClass('current current-group');
//      });
      $(this).addClass('current');
      $(e.target).addClass('current');
    }
  });

  /**
   * 階層の表示・非表示のアイコン（>）がクリックされた時に、階層を開く・開かないの動作を制御します。
   *
   */
  $('div.sidebar li').click(function (e) {
    if ($(this).attr('aria-expanded') === undefined) {
      return true;
    }
    var target = e.target;
    var parent = $(target).parent().get(0);
    if (e.target === this) {
      if ($(this).attr('aria-expanded') === 'true') {
        $(this).attr('aria-expanded', 'false');
        $(this).find('ul').first().hide();
      } else {
        $(this).attr('aria-expanded', 'true');
        $(this).find('ul').first().show();
      }
    }
    if (parent === this) {
      $(this).attr('aria-expanded', 'true');
      $(this).find('ul').first().show();
    }
  });

  /**
   * 外部リンク（reference external）の場合は、別タブで開きます。
   *
   */
  $('a.reference.external').click(function () {
    window.open($(this).attr('href'));
    return false;
  });

  /**
   * Naviをコピーアイコンをクリックした時に、パンクズリストをクリックボードにコピーします。
   *
   */
  $('#copy-breadcrumbs').click(function (e) {
    var text = "";
    $('div.topnav ul.breadcrumbs').find('a').each(function (i, node) {
      text = text + " / " + $(node).text();
    });
    copyToClipboard(text);
    alert("パンクズリストをクリックボードにコピーしました。\nテキストエディターなどにペーストしてご利用ください。");
    return false;
  });

  /**
   * メニューアイコンをクリックした時に、サイドバーの目次を表示・非表示にします。
   *
   */
  $('#toggle-menu').click(function (e) {
    var sidebar = $('div.sidebar');
    if (sidebar.is(':visible')) {
      sidebar.hide();
      // サイドバーが非表示の場合は、コンテンツの幅やマージを変更して、コンテンツがブラウザーの中央に表示されるようにします。
      $('div.content').css('width', '100%');
      $('div.content').css('margin-left', '0');
      $.cookie(MENU_COOKIE_KEY, 'hide', { expires: 30, path: '/' });
    } else {
      // サイドバーが表示の場合は、CSSの設定をリセットします。
      sidebar.show();
      $('div.content').css('width', '');
      $('div.content').css('margin-left', '');
      $.cookie(MENU_COOKIE_KEY, 'show', { expires: 30, path: '/' });
    }
  });

  /**
   * メニューの階層表示を調整します。
   * 主に外部リンクでページ内リンクされている場合に、指定されているメニューを階層表示させるための処理です。
   * メニューの階層を全て閉じて、カレントメニューの階層だけを開きます。
   *
   */
  function adjustMenu() {
    addClassMenuNodeAndParentNodeAsCurrent($('div.sidebar .current').last());
  }

  /**
   * 指定されたメニューノードと親階層をカレントに設定します。
   *
   * menuNodeは、aタグのことです。
   */
  function addClassMenuNodeAndParentNodeAsCurrent(menuNode) {
    // 階層を全て閉じ、全てのカレントとカレントグループを削除することで初期化します。
    $('div.sidebar li>ul').parent().attr('aria-expanded', 'false');
    $('div.sidebar li>ul').hide();
    $("div.sidebar .current").each(function (i, node) {
      $(node).removeClass('current');
    });
    $("div.sidebar .current-group").each(function (i, node) {
      $(node).removeClass('current-group');
    });
    // 指定されたメニューノードをカレントにします。
    setTimeout(function() {
        menuNode.focus();
    }, 0);
    menuNode.addClass('current');
    menuNode.parent().addClass('current');
    // 親階層（liとaタグ）をカレントに設定します。
    menuNode.parents('li').each(function (i, node) {
      // $(node).addClass('current')
      if ($(node).attr('aria-expanded') !== undefined) {
        // 階層アイコンを開くにする。
        $(node).attr('aria-expanded', 'true');
        $(node).find('ul').first().show();
      }
      $(node).find('a').first().addClass('current');
    });
    // 指定されたメニューの階層をカレントグループにしたいため、子供の階層を持たない場合は、親階層をカレントグループに、そうでない場合は、自身をカレントグループにします。
    var liNode = menuNode.parent();
    if (liNode.find('ul').length == 0) {
      var liParent = liNode.parents('li').first();
      liParent.addClass('current-group');
    } else {
      liNode.addClass('current-group');
    }
  }

  /**
   * メール文面などの外部リンクからドキュメントが開かれた場合は、コンテンツのトップを調整し、ページ内リンクの場合は、該当するメニューにカンレントを設定します。
   *
   */
  function adjustDisplayPositionFromExternalLink() {
    if (window.location.hash.length > 0) {
      var $id = $(decodeURIComponent(window.location.hash).replace(/(:|\.|\[|\]|\(|\))|,/g, "\\$1"));
      if ($id.length > 0) {
        setTimeout(function () {
          $(document).scrollTop($id.position().top + OFFSET_TOP);
          $('html, body').animate({ scrollTop: $id.position().top + OFFSET_TOP }, 100, 'swing');
        }, 50);
        // ページ内リンクの場合は、該当するメニューにカンレントを設定します。
        var hrefValue = '#' + $id.attr('id');
        if (hrefValue) {
          $("div.sidebar a[href='" + hrefValue + "']").each(function (i, node) {
            $(node).addClass('current');
            $(node).parent().addClass('current');
          });
        }
      }
    }
  }

  /**
   * 指定されたテキストをクリックボードにコピーします。
   *
   */
  function copyToClipboard(text) {
    var txt = document.createElement("textarea");
    txt.textContent = text;
    txt.classList.add("visually-hidden");
    document.body.appendChild(txt);
    txt.select();
    try {
      return document.execCommand("copy");
    } catch (ex) {
      return false;
    } finally {
      document.body.removeChild(txt);
    }
  }

  /**
   * メニューの表示非表示をクッキーに保存した値から判定して制御します。
   * デフォルトでは、サイドバーは表示のため、非表示の場合にのみ閉じます。
   */
  function toggleDisplayOfMenu() {
    if ($.cookie(MENU_COOKIE_KEY) == 'hide') {
      var sidebar = $('div.sidebar');
      sidebar.hide();
      $('div.content').css('width', '100%');
      $('div.content').css('margin-left', '0');
      $.cookie(MENU_COOKIE_KEY, 'hide', { expires: 30, path: '/' });
    }
  }

  /**
   * URLがhttp始まりの場合は、パートナーサイトのリンクを表示します。そうでない場合は、非表示です。
   * これは、ドキュメントがイントラネットでローカル環境で閲覧されている場合にサイトへのリンクを抑制するために処理です。
   */
  function toggleDisplayOfPartnerSiteLink() {
    var baseUrl = window.location.href;
    if (baseUrl !== undefined && baseUrl.indexOf('http') == 0) {
      $('.partner-site').show();
    } else {
      $('.partner-site').hide();
    }
  }
});
