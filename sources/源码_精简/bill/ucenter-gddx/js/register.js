function chooseTenantPage() {
    window.CT = new ChooseTenant({id: "selectTenant", wrap: "#selectTenant"})
}
function ChooseTenant(e) {
    this.conf = e, this.define = defineCT, this.init = initCT, this.init()
}
function defineCT() {
    this.id = this.conf.id, this.wrap = $(this.conf.wrap), this.dom = [], this.dom.tntItem = $(this.wrap.find("ul.tenantlist li a")), this.dom.tntchecked = $(this.wrap.find("input#e")), this.dom.tntdefine = $(this.wrap.find('input[name = "selectTenantid"]')), this.dom.submit = $(this.wrap.find("#postBtn")), this.eFun = this, this.eFun.choose = chooseCT, this.eFun.submit = submitCT, this.activePublish = activePublish, this.maskPublish = maskPublish
}
function initCT() {
    this.define(), this.maskPublish(this.dom.submit), this.eFun.choose(), this.eFun.submit()
}
function chooseCT() {
    var e = this;
    this.dom.tntItem.bind("click", function () {
        var t = $(this);
        e.dom.tntItem.removeClass("current"), t.addClass("current"), e.activePublish(e.dom.submit), e.dom.tntdefine.attr("value", t.attr("val"))
    })
}
function submitCT() {
    var e = this;
    this.dom.submit.bind("click", function () {
        e.wrap.submit()
    })
}
function regSendMailPage() {
    window.SAM = new SendActivateMail({id: "againSend", wrap: "#againSend", ajaxUrl: G_Info.againSendEmailUrl, email: G_Info.Email, tenantId: G_Info.TenantId, InviteUserId: G_Info.InviteUserId, source: G_Info.source})
}
function regSendPasswordPage() {
    window.SAM = new SendActivateMail({id: "againSendPassword", wrap: "#againSendPassword", ajaxUrl: G_Info.getFindPasswordUrl, email: G_Info.emailPassword, from: G_Info.from})
}
function SendActivateMail(e) {
    this.conf = e, this.define = defineSAM, this.init = initSAM, this.init()
}
function defineSAM() {
    this.id = this.conf.id, this.wrap = $(this.conf.wrap), this.ajaxUrl = this.conf.ajaxUrl, this.email = this.conf.email, this.from = this.conf.from, this.tenantId = this.conf.tenantId, this.InviteUserId = this.conf.InviteUserId || this.InviteUserId, this.source = this.conf.source || "", this.againMail = againMailSAM, this.tajax = !1
}
function initSAM() {
    this.define(), this.againMail()
}
function againMailSAM() {
    var e = this, t = this.from, n = this.ajaxUrl, r = this.email, i = this.InviteUserId, s = this.source, o = this.tenantId ? this.tenantId : undefined;
    this.wrap.bind("click", function () {
        if (t == 1)var u = {email: r}; else var u = {e: r, t: o, inviteUserId: i, source: s};
        var a = $(this);
        e.tajax || (e.tajax = !0, $.ajax({type: "GET", url: n + "?v=" + (new Date).getTime(), data: u, success: function (t) {
            e.tajax = !1, t.Result == 1 ? DialogT.show(a, {sureHide: !1, cancelHide: !1, text: "发送成功", autoHide: !0, verifyClass: "yes_verify"}) : DialogT.show(a, {sureHide: !1, cancelHide: !1, text: "发送失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"})
        }}))
    })
}
function FormInputValidate(e) {
    this.conf = e, this.define = defineFIV, this.init = initFIV, this.addEvent = addEventFIV, this.init()
}
function defineFIV() {
    this.id = this.conf.id, this.dom = {}, this.dom.input = $(this.conf.input), this.dom.iptprt = $(this.dom.input.parents("div.input_text")), this.dom.tip = null, this.dom.tipInner = null, this.eFun = this, this.eFun.inputky = inputKeyupFIV, this.eFun.inputfc = inputFocusFIV, this.eFun.inputbl = inputBlurFIV, this.eFun.inputkc = inputKeyCodeFIV, this.eFun.inputkdExtra = reservedNullFIV, this.eFun.inputkyExtra = reservedNullFIV, this.eFun.inputfcExtra = reservedNullFIV, this.eFun.inputblExtra = reservedNullFIV, this.eFun.inputkcExtra = reservedNullFIV, this.validate = validateFIV, this.showtip = showtipFIV, this.activePublish = activePublish, this.maskPublish = maskPublish, this.formItemTip = this.conf.formItemTip, this.itemUtil = this.conf.formItemUtil, this.norequire = this.conf.norequire, this.sty = this, this.sty.focus = "focusinput", this.sty.error = "errorinput", this.sty.blur = "blurinput", this.pass = !1
}
function initFIV() {
    this.define(), this.dom.tip ? this.dom.tip = $("#FIV_" + this.id) : ($(this.itemUtil.tipDom.join("")).attr("id", "FIV_" + this.id).appendTo(document.body), this.dom.tip = $("#FIV_" + this.id), this.dom.tipInner = this.dom.tip.find("div.inner_alidttip")), this.addEvent()
}
function addEventFIV() {
    var e = this;
    this.dom.input.bind("focus",function (t) {
        var n = $(this);
        return e.eFun.inputfc(), e.eFun.inputfcExtra(t, n)
    }).bind("keydown",function (t) {
            var n = $(this);
            return e.eFun.inputkdExtra(t, n)
        }).bind("keyup",function (t) {
            var n = $(this);
            return e.eFun.inputky(t), e.eFun.inputkc(t), e.eFun.inputkyExtra(t, n),e.eFun.inputbl(), e.eFun.inputblExtra(t, n)
        }).bind("blur",function (t) {
            var n = $(this);
            return e.eFun.inputbl(), e.eFun.inputblExtra(t, n)
        }).bind("paste", function (t) {
            setTimeout(function () {
                return e.eFun.inputkdExtra(t, self)
            }, 300)
        }), $(window).bind("resize", function () {
        e.dom.tip.css("display") != "none"
    })
}
function inputKeyupFIV(e) {
    var t = $.trim(this.dom.input.val());
    return this.dom.iptprt.removeClass(this.sty.error), this.showtip({text: this.formItemTip.remindTip}), t == "" && (this.showtip({text: this.formItemTip.remindTip}), this.pass = !1), !this.validate() && t != "" ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip, error: !0}), this.pass = !1, !1) : (this.validate() && (this.pass = !0), !0)
}
function inputFocusFIV() {
    var e = $.trim(this.dom.input.val());
    this.dom.iptprt.addClass(this.sty.focus), e == "" && (this.dom.iptprt.removeClass(this.sty.error), this.showtip({text: this.formItemTip.remindTip}))
}
function inputBlurFIV() {
    var e = $.trim(this.dom.input.val());
    this.dom.iptprt.removeClass(this.sty.focus), this.dom.iptprt.addClass(this.sty.blur), this.pass = !1;
    if (!this.norequire) {
        if (e == "")return this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.remindTip, error: !0}), !0
    } else e == "" && this.dom.tip.hide();
    this.validate() && e != "" && (this.dom.iptprt.removeClass(this.sty.error), this.showtip({right: !0}), this.pass = !0)
}
function inputKeyCodeFIV(e, t) {
    var n = e.keyCode, r = this.dom.input.val();
    n == 9 && this.dom.input.select(!1);
    if (n == 8 || n == 46 || n == 37 || n == 39 || n == 9)return!0
}
function validateFIV() {
    var e = $.trim(this.dom.input.val()), t = this.formItemTip.patten;
    return t.test(e) ? !0 : !1
}
function showtipFIV(e) {
    var t = this.dom.tip, n = this.dom.tipInner, r = this.dom.iptprt, i = e.text, s = e.error, o = e.right, u = r.innerWidth(), a = r.innerHeight(), f = r.offset(), l = t.innerWidth(), c = t.innerHeight();
    s === !0 ? t.addClass("error_validttip") : t.removeClass("error_validttip"), i && n.html(i), t.css({display: "block", position: "absolute", left: f.left + u + 5, top: f.top}), o ? (t.addClass("right_validttip"), t.css({display: "block", position: "absolute", "z-index": "990", left: f.left + u + 5, top: f.top + 6})) : t.removeClass("right_validttip")
}
function reservedNullFIV() {
}
function submitFIV_testreg() {
    submitDataFiv_testreg()
}
function submitDataFiv_testreg() {
    var e = G_Info.applyRegUrl, t = $("#familyName").val(), n = $("#companyName").val(), r = $("#companyEmail").html(), i = $("#employeeNum").val(), s = $("#phoneNum").val();
    $.ajax({type: "post", url: e + "?v=" + (new Date).getTime(), dataType: "json", data: {applyUserName: t, companyName: n, email: r, firmSize: i, phone: s}, success: function (e) {
        var t = parseInt(e.result), n = "任务失败", r = "", i = "", s = function () {
            DialogT.hide()
        };
        maskPublish($("#submitCreateSubset"));
        switch (t) {
            case 1:
                n = "<span style='font-weight:normal; color:#666'>信息已提交成功！我们将尽快审核<br/>并邮件告知您结果，谢谢！</span>", r = "yes_verify", i = "<span style='font-weight:normal; color:#666'>我知道了</span>";
                break;
            case 2:
                n = "<span style='font-weight:normal; color:#666'>该邮箱帐号已参与过申请，<br/>请等待审核结果</span>", i = "<span style='font-weight:normal; color:#666'>我知道了</span>";
                break;
            case 3:
                n = "<span style='font-weight:normal; color:#666'>该邮箱帐号已获得试用权限，<br/>请直接登录</span>", i = "<span style='font-weight:normal; color:#666'>返回首页</span>", s = function () {
                    location.href = "http://www.tita.com"
                }
        }
        DialogT.show($("#submitCreateSubset"), {sureHide: !1, cancel: s, cancelText: "<span style='font-weight:normal; color:#666'>我知道了</span>", text: n, verifyClass: r})
    }, error: function (e) {
    }})
}
function createSubsetPage() {
    var e = {name: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_()（）\.]){1,20}$/, remindTip: "请填写您的姓名<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>", rightTip: "", errorTip: "允许1-20位中文、字母、数字、下划线、圆点、圆括号"}, company: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z（）()]){1,20}$/, remindTip: "请填写您的企业名称<br><em>允许1-20位，中文、英文、数字和圆括号<em>", rightTip: "", errorTip: '<span for="Name" generated="true" class="tn-pop-error" style="display:block">允许1-20位，中文、英文、数字和圆括号</span>'}, phone: {patten: /^[\d\-+()]{1,}$/, remindTip: "请填写您的电话号码<br><em>允许数字、短横线<em>", rightTip: "", errorTip: "请输入正确的电话号码<br>例如：010-1234567"}, email: {patten: "^([a-zA-Z0-9][_.-]*)+@([A-Za-z0-9])+((.|-|_)[A-Za-z0-9]+)*((.[A-Za-z0-9]{2,4}){1,2})$", remindTip: "请填写您的企业邮箱<br><em>格式xxx@xxx.xxx<em>", rightTip: "", errorTip: "请输入正确格式的电子邮件", warmTip1: '该邮箱帐号已获得试用权限，请用<br/>TMS帐号直接登录&nbsp;<a href="http://www.tita.com" style="text-decoration:none; color:#039">返回首页</a>', warmTip2: '该邮箱帐号已参加申请，<br/>请等待审核结果&nbsp;<a href="http://www.tita.com" style="text-decoration:none; color:#039">返回首页</a>'}, employee: {patten: /^\d{1,}$/, remindTip: "请填写您的员工人数<br><em>允许数字<em>", rightTip: "", errorTip: "请填写您的员工人数<br>允许数字"}, telphone: {patten: "^\\d{1,}$", remindTip: "请填写您的电话号码<br><em>允许数字<em>", rightTip: "", errorTip: "请填写您的员工人数<br>允许数字、短横线，正确格式如010-12345678"}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}};
    window.FIV_name = new FormInputValidate({id: "name", input: "#familyName", formItemTip: e.name, formItemUtil: e.util}), window.FIV_company = new FormInputValidate({id: "company", input: "#companyName", formItemTip: e.company, formItemUtil: e.util}), window.FIV_employee = new FormInputValidate({id: "employee", input: "#employeeNum", formItemTip: e.employee, formItemUtil: e.util}), window.FIV_phone = new FormInputValidate({id: "phone", input: "#phoneNum", formItemTip: e.phone, formItemUtil: e.util}), $("#submitCreateSubset").bind("click", function () {
        submitFIV_testreg()
    }), window.FIV_name.eFun.inputkyExtra = validateNameKeyup, window.FIV_company.eFun.inputkyExtra = validateNameKeyup, window.FIV_employee.inputkyExtra = openLock, window.FIV_phone.inputkyExtra = openLock, window.FIV_name.dom.input.attr("maxlength", "20"), window.FIV_company.dom.input.attr("maxlength", "20"), formRest("#createSubsetForm"), maskPublish($("#submitCreateSubset"))
}
function validateNameKeyup(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(n), /^ | $/.test(this.dom.input.val()) && this.dom.input.val(n), n.length > 20 && (this.dom.input.val(n.substring(0, 20)), this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide()), openLock()
}
function openLock() {
    var e = FIV_name.pass, t = FIV_company.pass, n = FIV_employee.pass, r = FIV_phone.pass, i = !0;
    i = e && t && n && r, i ? activePublish($("#submitCreateSubset")) : maskPublish($("#submitCreateSubset"))
}
function validateNameKeydown() {
    var e = $.trim(this.dom.input.val());
    e.length > 20 && this.dom.input.val(e.substring(0, 20))
}
function writeBasicInfoPage() {
    subStringCode(), window.WBI_company = new FormInputValidate({id: "company", input: "#companyName", formItemTip: formItemTip_basicinfo.company, formItemUtil: formItemTip_basicinfo.util}), window.WBI_name = new FormInputValidate({id: "name", input: "#name", formItemTip: formItemTip_basicinfo.name, formItemUtil: formItemTip_basicinfo.util}), window.WBI_password = new FormInputValidate({id: "password", input: "#password", formItemTip: formItemTip_basicinfo.password, formItemUtil: formItemTip_basicinfo.util}), window.WBI_againpassword = new FormInputValidate({id: "againpassword", input: "#againpassword", formItemTip: formItemTip_basicinfo.againpassword, formItemUtil: formItemTip_basicinfo.util}), window.WBI_position = new FormInputValidate({id: "position", input: "#position", formItemTip: formItemTip_basicinfo.position, formItemUtil: formItemTip_basicinfo.util, norequire: 1}), window.WBI_shortname = new FormInputValidate({id: "Abbreviation", input: "#Abbreviation", formItemTip: formItemTip_basicinfo.shortname, formItemUtil: formItemTip_basicinfo.util, norequire: 1}), window.WBI_company.eFun.inputkyExtra = validateMaxKeyup, window.WBI_company.eFun.inputkdExtra = validatePositionKeydown, window.WBI_shortname.eFun.inputkyExtra = validateMaxKeyup, window.WBI_name.eFun.inputkyExtra = validateMaxKeyup, window.WBI_name.eFun.inputkdExtra = validatePositionKeydown, window.WBI_password.eFun.inputkyExtra = openLockWBI, window.WBI_password.eFun.inputblExtra = validatePw3, window.WBI_againpassword.eFun.inputkyExtra = openLockWBI, window.WBI_againpassword.eFun.inputblExtra = validatePw2, window.WBI_position.eFun.inputkyExtra = validateMaxKeyup, window.WBI_position.eFun.inputkdExtra = validatePositionKeydown, window.WBI_company.dom.input.attr("maxlength", "20"), window.WBI_name.dom.input.attr("maxlength", "20"), window.WBI_position.dom.input.attr("maxlength", "20"), window.WBI_shortname.eFun.inputkdExtra = validatePositionKeydown, formRest("#registerFrom"), maskPublish($("#submitBasicInfo")), $("#submitBasicInfo").bind("click", function () {
        submit_SBI()
    })
}
function openLockWBI() {
    var e = WBI_name.pass, t = WBI_password.pass, n = WBI_againpassword.pass, r = WBI_position.pass, i = WBI_shortname.pass, s = WBI_company.pass, o = !0;
    if ($("#Abbreviation").length)if (s && e && t && n) {
        activePublish($("#submitBasicInfo"));
        var u = WBI_shortname.dom.input.val();
        if (i && $.trim(u) != "")activePublish($("#submitBasicInfo")); else if ($.trim(u) != "") {
            maskPublish($("#submitBasicInfo"));
            return
        }
        var a = WBI_position.dom.input.val();
        if (r && $.trim(a) != "")activePublish($("#submitBasicInfo")); else if ($.trim(a) != "") {
            maskPublish($("#submitBasicInfo"));
            return
        }
    } else maskPublish($("#submitBasicInfo")); else if (e && t && n) {
        var a = WBI_position.dom.input.val();
        !r && $.trim(a) != "" ? maskPublish($("#submitBasicInfo")) : activePublish($("#submitBasicInfo"))
    } else maskPublish($("#submitBasicInfo"))
}
function validateCompanyKeyup() {
    var e = $.trim(this.dom.input.val());
    this.dom.input.val(encodescript(e)), openLockWBI()
}
function validatePositionKeydown(e) {
    var t = e.keyCode;
    return t == 8 || t == 46 || t == 37 || t == 39 || t == 9 || t == 65 ? !0 : !0
}
function validateMaxKeyup(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(encodescript(n)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(n), n.length > 20 && (this.dom.input.val(n.substring(0, 20)), this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide()), openLockWBI()
}
function validateMaxKeyup_shortName(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(encodescript(n)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(n), n.length > 6 && (this.dom.input.val(n.substring(0, 6)), this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide()), openLockWBI()
}
function validatePw2() {
    var e = this.dom.input.val();
    return e != $("#password").val() ? (maskPublish($("#submitBasicInfo")), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}
function validatePw3() {
    var e = this.dom.input.val();
    return e != $("#againpassword").val() && $("#againpassword").val() != "" ? (maskPublish($("#submitBasicInfo")), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}
function submit_SBI() {
    var e = $("#password").val(), t = $("#againpassword").val(), n = G_Info.checkFindPwdEmailUrl, r = G_Info.email;
    addLoad(), e == t ? $.ajax({type: "GET", url: n + "?v=" + (new Date).getTime(), data: {email: r}, success: function (e) {
        e.Result == 0 ? (removeLoad(), DialogT.show($("#submitBasicInfo"), {sureHide: !1, cancelHide: !1, text: "已填写过基本资料，请勿重复提交", autoHide: !0, verifyClass: "warm_verify"}), setTimeout(function () {
            window.location.href = G_Info.userhomePageUrl
        }, 300)) : ($("#submitBasicInfo").unbind(), $("#registerFrom").submit(), removeLoad())
    }}) : (window.FIV_againpassword.eFun.inputblExtra(), maskPublish($("#submitBasicInfo")))
}
function addLoad() {
    var e = '<div id="imgRegisterload" class="imgregisterload"><img src="http://st.tita.com/titacn/tita/common/images/load_s.gif" alt="" />加载中</div>', t = $("#imgRegisterload");
    if (t.length == 0) {
        var n = $("#submitBasicInfo").parent(".btn_bi");
        $(e).appendTo(n)
    } else t.show()
}
function removeLoad() {
    var e = $("#imgRegisterload");
    e.length && e.remove()
}
function FindPassword(e) {
    this.conf = e, this.define = defineFP, this.init = initFP, this.init()
}
function defineFP() {
    this.id = this.conf.id, this.input = $(this.conf.input), this.defval = this.input.attr("defaultval"), this.submit = $(this.conf.submit), this.form = $(this.conf.form), this.url = this.conf.ajaxUrl, this.dom = [], this.dom.tip = null, this.dom.iptprt = $(this.input.parents("div.input_text")), this.eFun = this, this.eFun.inputfu = inputFocusFP, this.eFun.inputbl = inputBlurFP, this.eFun.inputup = inputKeyupFP, this.eFun.inputkc = keyCodeFP, this.eFun.getFind = getFindFP, this.resetForm = formRest, this.addEvent = addEventFP, this.validate = validateFP, this.formItemTip = this.conf.formItemTip, this.itemUtil = this.formItemTip.util, this.showtip = showtipFP, this.sty = this, this.sty.focus = "focusinput", this.sty.error = "errorinput", this.sty.blur = "blurinput", this.formItemTip = this.formItemTip, this.util = '<div class="errortext"></div>', this.encodescript = encodescript, this.activePublish = activePublish, this.maskPublish = maskPublish, this.formRest = formRest, this.tajax = !1
}
function initFP() {
    this.define(), this.addEvent(), this.maskPublish(this.submit), this.formRest(this.form), this.dom.tip ? this.dom.tip = $("#FP_" + this.id) : ($(this.util).attr("id", "FP_" + this.id).appendTo(document.body), this.dom.tip = $("#FP_" + this.id))
}
function addEventFP() {
    var e = this;
    this.input.each(function () {
        $(this).bind("focus",function () {
            var t = $(this);
            e.eFun.inputfu()
        }).bind("blur",function (t) {
                var n = $(this);
                e.eFun.inputbl()
            }).bind("keyup", function (t) {
                var n = $(this);
                return e.eFun.inputup(), e.eFun.inputkc(t), e.eFun.inputkc(t)
            })
    }), this.submit.bind("click", function () {
        setTimeout(function () {
            e.eFun.getFind()
        }, 30)
    })
}
function inputFocusFP(e) {
    var t = this.input.val();
    t == this.defval && this.input.val(""), this.dom.iptprt.addClass(this.sty.focus)
}
function inputBlurFP(e) {
    var t = $.trim(this.input.val()), n = this.defval;
    this.dom.iptprt.removeClass(this.sty.error), this.dom.iptprt.removeClass(this.sty.focus).addClass(this.sty.blur), this.dom.tip.hide(), !this.validate(t) && t != "" && (this.maskPublish(this.submit), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip})), t == "" ? (this.input.val(n), this.dom.iptprt.removeClass(this.sty.blur)) : this.input.val(t)
}
function inputKeyupFP() {
    var e = $.trim(this.input.val());
    this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide(), e != "" ? this.activePublish(this.submit) : this.maskPublish(this.submit)
}
function showtipFP(e) {
    var t = this.dom.tip, n = this.input.parents("div.input_text"), r = e.text, i = e.error, s = e.right, o = n.innerWidth(), u = n.innerHeight(), a = n.offset(), f = t.innerWidth(), l = t.innerHeight();
    t && t.html(r), t.css({display: "block", position: "absolute", left: a.left, top: a.top + u + 2})
}
function validateFP(e) {
    var t = this.formItemTip.patten;
    return t.test(e) ? !0 : !1
}
function keyCodeFP(e) {
    var t = e.keyCode, n = $.trim(this.input.val());
    if (t == 8 || t == 46 || t == 37 || t == 39)return!0;
    t == 13 && n != "" && this.eFun.getFind(), t == 13 && n == "" && (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip}))
}
function getFindFP() {
    var e = this, t = this.url, n = $.trim(this.input.val()), r = $.trim(this.encodescript(n));
    if (!this.validate(n) && n != "")return this.maskPublish(this.submit), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip}), !1;
    this.maskPublish(this.submit), this.tajax || (this.tajax = !0, $.ajax({type: "GET", url: t + "?v=" + (new Date).getTime(), data: {email: r}, success: function (t) {
        e.tajax = !1, t.Result == 1 ? (e.dom.iptprt.removeClass(e.sty.error), e.dom.iptprt.removeClass(e.sty.blur), e.form.submit(), e.resetForm(e.form)) : t.Msg.Status == -1 ? (e.dom.iptprt.addClass(e.sty.error), e.showtip({text: e.formItemTip.errorTip3})) : t.Msg.Status == -2 ? (e.dom.iptprt.addClass(e.sty.error), e.showtip({text: e.formItemTip.errorTip4})) : (e.dom.iptprt.addClass(e.sty.error), e.showtip({text: e.formItemTip.errorTip2}), DialogT.show(e.submit, {sureHide: !1, cancelHide: !1, text: "发送失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"}))
    }}))
}
function findPasswrodPage() {
    window.FPP = new FindPassword({id: "findpassword", formItemTip: formItemTip_FP.findpassword, input: "#inputfindpassword", submit: "#submitFP", form: "#formfindpassword", ajaxUrl: G_Info.checkFindPwdEmailUrl})
}
function resetPasswordPage() {
    var e = {newPassword: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写"}, newPassword2: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请再次输入新密码", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写", errorTip2: "与第一次输入不相同，请重新输入"}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}};
    window.RP_newPassword = new FormInputValidate({id: "newPassword", input: "#newPassword", formItemTip: e.newPassword, formItemUtil: e.util}), window.RP_newPassword2 = new FormInputValidate({id: "newPassword2", input: "#newPassword2", formItemTip: e.newPassword2, formItemUtil: e.util}), formRest("#formResetPassword"), maskPublish($("#submitResetPassword")), window.RP_newPassword.eFun.inputkyExtra = openLockRP, window.RP_newPassword.eFun.inputblExtra = validatePw1RP, window.RP_newPassword2.eFun.inputkyExtra = openLockRP, window.RP_newPassword2.eFun.inputblExtra = validatePw2RP, $("#submitResetPassword").bind("click", function () {
        submitDataRP()
    })
}
function openLockRP() {
    var e = $.trim(this.dom.input.val());
    e == "" && this.dom.input.val(encodescript(e)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(e);
    var t = RP_newPassword.pass, n = RP_newPassword2.pass, r = !0;
    r = t && n, r ? activePublish($("#submitResetPassword")) : maskPublish($("#submitResetPassword"))
}
function validatePw1RP() {
    var e = this.dom.input.val();
    return e != $("#newPassword2").val() && $("#newPassword2").val() != "" ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), maskPublish($("#submitResetPassword")), !1) : !0
}
function validatePw2RP() {
    var e = this.dom.input.val();
    return e != $("#newPassword").val() ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), maskPublish($("#submitResetPassword")), !1) : !0
}
function submitDataRP() {
    var e = $("newPassword").val(), t = $("#againpassword2").val();
    e == t ? submitRestPasswordRP() : (window.RP_newPassword2.eFun.inputblExtra(), maskPublish($("#submitResetPassword")))
}
function submitRestPasswordRP() {
    var e = !1, t = $.trim(encodescript($("#newPassword").val()));
    maskPublish($("#submitResetPassword")), formRest("#formResetPassword"), $(".validttipwrap").hide(), e || (e = !0, $.ajax({type: "GET", url: G_Info.restPasswordUrl + "?v=" + (new Date).getTime(), data: {urlPara: G_Info.urlPara, pwd: t}, success: function (t) {
        e = !1, t.Result == 1 ? (DialogT.show($("#submitResetPassword"), {sureHide: !1, cancelHide: !1, text: "保存成功", autoHide: !0, verifyClass: "yes_verify"}), setTimeout(function () {
            window.location.href = t.Msg.LogInUrl
        }, 3e3)) : DialogT.show($("#submitResetPassword"), {sureHide: !1, cancelHide: !1, text: "保存失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"})
    }}))
}
function JoinTenants(e) {
    this.conf = e, this.define = defineJT, this.init = initJT, this.init()
}
function defineJT() {
    this.id = this.conf.id, this.input = $(this.conf.input), this.input2 = $(this.conf.input2), this.defval = this.input.attr("defaultval"), this.submit = $(this.conf.submit), this.form = $(this.conf.form), this.url = this.conf.ajaxUrl, this.dom = [], this.dom.tip = null, this.dom.iptprt = $(this.input.parents("div.input_text")), this.eFun = this, this.eFun.inputfu = inputFocusJT, this.eFun.inputbl = inputBlurJT, this.eFun.inputup = inputKeyupJT, this.eFun.inputkc = keyCodeJT, this.eFun.getJion = getJionJT, this.resetForm = formRest, this.addEvent = addEventJT, this.validate = validateJT, this.formItemTip = this.conf.formItemTip, this.itemUtil = this.formItemTip.util, this.showtip = showtipJT, this.sty = this, this.sty.focus = "focusinput", this.sty.error = "errorinput", this.sty.blur = "blurinput", this.formItemTip = this.formItemTip, this.util = '<div class="errortext"></div>', this.encodescript = encodescript, this.activePublish = activePublish, this.maskPublish = maskPublish, this.formRest = formRest, this.tajax = !1
}
function initJT() {
    this.define(), this.addEvent(), this.maskPublish(this.submit), this.formRest(this.form), this.dom.tip ? this.dom.tip = $("#JT_" + this.id) : ($(this.util).attr("id", "JT_" + this.id).appendTo(document.body), this.dom.tip = $("#JT_" + this.id))
}
function addEventJT() {
    var e = this;
    this.input.each(function () {
        $(this).bind("focus",function () {
            var t = $(this);
            e.eFun.inputfu()
        }).bind("blur",function (t) {
                var n = $(this);
                e.eFun.inputbl()
            }).bind("keyup", function (t) {
                var n = $(this);
                return e.eFun.inputup(), e.eFun.inputkc(t)
            })
    }), this.submit.bind("click", function () {
        setTimeout(function () {
            e.eFun.getJion()
        }, 30)
    })
}
function inputFocusJT(e) {
    var t = this.input.val();
    t == this.defval && this.input.val(""), this.dom.iptprt.addClass(this.sty.focus)
}
function inputBlurJT(e) {
    var t = $.trim(this.input.val()), n = this.defval;
    this.dom.iptprt.removeClass(this.sty.error), this.dom.iptprt.removeClass(this.sty.focus).addClass(this.sty.blur), this.dom.tip.hide(), !this.validate(t) && t != "" && t != n && (this.maskPublish(this.submit), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip})), this.input.val(t), t == "" && (this.input.val(n), this.dom.iptprt.removeClass(this.sty.error), this.dom.iptprt.removeClass(this.sty.blur))
}
function inputKeyupJT() {
    var e = $.trim(this.input.val());
    this.input2.val(e + "@" + G_Info.mailTo), this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide(), this.maskPublish(this.submit), e != "" && this.activePublish(this.submit)
}
function showtipJT(e) {
    var t = this.dom.tip, n = this.input.parents("div.input_text"), r = e.text, i = e.error, s = e.right, o = n.innerWidth(!0), u = n.innerHeight(!0), a = n.offset(), f = t.innerWidth(), l = t.innerHeight();
    t && t.html(r), t.css({display: "block", position: "absolute", left: a.left, top: a.top + u + 4})
}
function validateJT(e) {
    var t = this.formItemTip.patten;
    return t.test(e) ? !0 : !1
}
function keyCodeJT(e) {
    var t = this, n = e.keyCode;
    if (n == 8 || n == 46 || n == 37 || n == 39)return!0;
    n == 13 && this.eFun.getJion()
}
function getJionJT() {
    var e = this, t = this.url, n = $.trim(this.input.val()), r = this.input.attr("defaultval"), i = $.trim(this.encodescript(n)) + "@" + G_Info.mailTo;
    if (!this.validate(n) && n != "" && n != r)return this.maskPublish(this.submit), this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip}), !1;
    if (n == "")return this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip3}), !1;
    this.maskPublish(this.submit), this.tajax || (this.tajax = !0, $.ajax({type: "GET", url: t + "?v=" + (new Date).getTime(), data: {email: i}, success: function (t) {
        e.tajax = !1, t && (t.Result == 1 ? (e.form.submit(), e.input.blur(), e.dom.iptprt.removeClass(e.sty.error), e.dom.iptprt.removeClass(e.sty.blur), e.resetForm(e.form)) : (t.Msg.Status == -1 ? e.showtip({text: e.formItemTip.errorTip1}) : t.Msg.Status == -2 ? e.showtip({text: e.formItemTip.errorTip2}) : DialogT.show(e.submit, {sureHide: !1, cancelHide: !1, text: "提交失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"}), e.dom.iptprt.addClass(e.sty.error), e.showtip({text: e.formItemTip.errorTip2})))
    }}))
}
function joinTenantsPage() {
    window.JTP = new JoinTenants({id: "joinjenants", formItemTip: formItemTip_JT.mail, input: "#mail", input2: "#mail2", submit: "#submitJoinTenants", form: "#formJoinTenants", ajaxUrl: G_Info.regEmailValidateurl})
}
function nonbusinessRegPage() {
    var e = {name: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_()（）\.]){1,20}$/, remindTip: "请填写您的姓名<br><em>允许中文、字母、数字、下划线、圆点、圆括号，最多20个字<em>", rightTip: "", errorTip: "！只能填写中文、字母、数字、下划线、圆点、圆括号，最多20个字"}, company: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z()（）]){1,20}$/, remindTip: "请填写您的企业名称<br><em>允许中文、字母、数字、圆括号，最多20个字<em>", rightTip: "", errorTip: '<span for="Name" generated="true" class="tn-pop-error" style="display:block">！只能填写中文、字母、数字、圆括号，最多20个字</span>'}, phone: {patten: /^[\d\-+（）()]{1,}$/, remindTip: "请填写您的电话号码<br><em>允许数字、短横线、圆括号、加号<em>", rightTip: "", errorTip: "！只能填写数字、短横线、圆括号、加号"}, email: {patten: /^([a-zA-Z0-9][_\.\-]*)+\@([A-Za-z0-9])+((\.|-|_)[A-Za-z0-9]+)*((\.[A-Za-z0-9]{2,4}){1,2})$/, remindTip: "请输入您的常用邮箱<br><em>正确格式如xxx@xxx.xxx<em>", rightTip: "", errorTip: "！格式不正确，正确格式如xxx@xxx.xxx", warmTip1: '该邮箱帐号已获得试用权限，请用<br/>TMS帐号直接登录&nbsp;<a href="http://www.tita.com" style="text-decoration:none; color:#039">返回首页</a>', warmTip2: '该邮箱帐号已参加申请，<br/>请等待审核结果&nbsp;<a href="http://www.tita.com" style="text-decoration:none; color:#039">返回首页</a>'}, industry: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_()（）\.]){1,20}$/, remindTip: "请填写您的企业所属行业<br><em>允许中文、字母、数字、下划线、圆点、圆括号，最多20个字<em>", rightTip: "", errorTip: "！只能填写中文、字母、数字、下划线、圆点、圆括号，最多20个字"}, url: {patten: /^[a-zA-Z]+:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/, remindTip: "请填写您的企业网址<br><em>格式如http://www.baidu.com/<em>", rightTip: "", errorTip: "！格式不正确，正确格式如http://www.baidu.com/"}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}};
    window.NRP_name = new FormInputValidate({id: "name", input: "#familyName", formItemTip: e.name, formItemUtil: e.util}), window.NRP_phone = new FormInputValidate({id: "phone", input: "#phoneNum", formItemTip: e.phone, formItemUtil: e.util}), window.NRP_mail = new FormInputValidate({id: "mail", input: "#mail", formItemTip: e.email, formItemUtil: e.util}), window.NRP_company = new FormInputValidate({id: "company", input: "#companyName", formItemTip: e.company, formItemUtil: e.util, norequire: 1}), window.NRP_industry = new FormInputValidate({id: "industry", input: "#companyIndustry", formItemTip: e.industry, formItemUtil: e.util, norequire: 1}), window.NRP_url = new FormInputValidate({id: "url", input: "#companyUrl", formItemTip: e.url, formItemUtil: e.util, norequire: 1}), $("#nonbusinessReg").bind("click", function () {
        $("#nonbusinessRegForm").submit()
    }), window.NRP_name.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_phone.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_mail.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_company.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_industry.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_url.eFun.inputkyExtra = validateNameKeyup_NRP, window.NRP_name.dom.input.attr("maxlength", "20"), window.NRP_company.dom.input.attr("maxlength", "20"), window.NRP_industry.dom.input.attr("maxlength", "20"), formRest("#nonbusinessRegForm"), maskPublish($("#nonbusinessReg"))
}
function validateNameKeyup_NRP(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(n), /^ | $/.test(this.dom.input.val()) && this.dom.input.val(n), openLock_NRP()
}
function openLock_NRP() {
    var e = NRP_name.pass, t = NRP_mail.pass, n = NRP_phone.pass, r = NRP_company.pass, i = NRP_industry.pass, s = NRP_url.pass, o = !0;
    o = e && t && n, o ? $.trim($("#companyName").val()) != "" && !r || $.trim($("#companyUrl").val()) != "" && !s || $.trim($("#companyIndustry").val()) != "" && !i ? maskPublish($("#nonbusinessReg")) : activePublish($("#nonbusinessReg")) : maskPublish($("#nonbusinessReg"))
}
function activePublish(e) {
    var t = e, n = $("#lockmasker_mblog");
    n.length != 0 && n.hide();
    var r = t.attr("disableClass");
    t.removeClass(r)
}
function maskPublish(e) {
    var t = e, n = $("#lockmasker_mblog"), r = t.outerWidth(), i = t.outerHeight(), s = t.offset(), o = '<span id="lockmasker_mblog" onclick="(function(event){var e=window.event||event;if(window.event){e.cancelBubble=true;}if(e.stopPropagation)e.stopPropagation();})(event);" style="position:absolute; display:block; opacity:0.1; filter:alpha(opacity=10); background:#fff"></span>';
    n.length == 0 && ($(o).attr("id", "lockmasker_mblog").appendTo(document.body), n = $("#lockmasker_mblog")), n.css({display: "block", left: s.left, top: s.top, width: r, height: i}), t.not(t.hasClass("mbtn_disable")) && t.addClass(t.attr("disableClass"))
}
function encodescript(e) {
    var t = /</g, n = />/g, r = e.replace(t, "&lt;"), i = r.replace(n, "&gt;");
    return i
}
function formRest(e) {
    $(e).get(0).reset()
}
function getByteVal(e, t) {
    var n = "", r = 0;
    for (var i = 0; i < e.length; i++) {
        e.charAt(i).match(/[^\x00-\xff]/ig) != null ? r += 2 : r += 1;
        if (r > t)break;
        n += e.charAt(i)
    }
    return n
}
function subStringCode() {
    var e = $("#Abbreviation"), t = e.attr("maxlength");
    e.bind("keyup change", function () {
        var e = $.trim($(this).val());
        $(this).val(getByteVal(e, t))
    })
}
function selectTenantPage() {
    window.selectTenant = new SelectTenant({id: "selectTenant", wrap: "#addTenant"}), linkOnlineService()
}
function SelectTenant(e) {
    this.conf = e, this.define(), this.maskPublish(this.dom.submit), this.choose(), this.submit()
}
function writePersonalInfoPage() {
    window.submibPersonalInfo = new SubmibPersonalInfo;
}
function SubmibPersonalInfo() {
    this.form = $("#fillUserInfo"), this.form.get(0).reset(), this.initInput(), this.submitData()
}
function validateMaxKeyupWPI(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(encodescript(n)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(n)
}
function regUserIndexPage() {
    window.submibTenantInfo = new SubmibTenantInfo, linkOnlineService()
}
function SubmibTenantInfo() {
    this.form = $("#tenantInfoForm"), this.submitBtn = $("#submitTenant"), this.form.get(0).reset(), this.initInput(), this.submitData()
}
function validateMaxKeyupSTI(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(encodescript(n)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(n), n.length > 20 && (this.dom.input.val(n.substring(0, 20)), this.dom.iptprt.removeClass(this.sty.error), this.dom.tip.hide())
}
function regSuccessPage
    () {
    window.sendMailAgain = new SendMailAgain, linkOnlineService()
}
function SendMailAgain() {
    this.submit()
}
function linkOnlineService() {
    $("#linkOnlineService").bind("click", function () {
        $("#titaOnline").trigger("click")
    })
}
function regForTaobaoPage() {
    window.submibTaobaoUserInfo = new SubmibTaobaoUserInfo, linkOnlineService()
}
function SubmibTaobaoUserInfo() {
    this.form = $("#fillUserInfo"), this.form.get(0).reset(), this.initInput(), this.submitData()
}
function validateMaxKeyupRTP(e, t) {
    var n = $.trim(this.dom.input.val());
    n == "" && this.dom.input.val(encodescript(n)), /^ | $/.test(encodescript(this.dom.input.val())) && this.dom.input.val(n)
}
function regForTaobaoErrorPage() {
    linkOnlineService()
}
function regForTaobaoSuccessPage() {
    linkOnlineService()
}
var formItemTip_basicinfo = {company: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z（）()]){1,20}$/, remindTip: "请输入企业名称<br><em>允许1-20位，中文、英文、数字和圆括号<em>", rightTip: "", errorTip: "允许中文、英文、数字和圆括号<br><em>最多20个字<em>"}, shortname: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z()（）]){1,12}$/, remindTip: '<span class="tn-pop-remind">该简称将显示在页面左上角logo区域<br><em>允许中文、字母、数字、圆括号，最多6个字</em></span>', rightTip: "", errorTip: '<span for="Name" generated="true" class="tn-pop-error" style="display:block">允许中文、字母、数字、圆括号，最多6个字</span>'}, name: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/, remindTip: "请填写您的姓名<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>", rightTip: "", errorTip: "允许1-20位中文、字母、数字、下划线、圆点、圆括号"}, password: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写"}, againpassword: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写", errorTip2: "与第一次输入不相同，请重新输入"}, position: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/, remindTip: "请填写您的职位信息<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>", rightTip: "", errorTip: "请填写您的职位信息<br>允许1-20位中文、字母、数字、下划线、圆点、圆括号"}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}}, formItemTip_FP = {findpassword: {patten: /^([a-zA-Z0-9][_\.\-]*)+\@([A-Za-z0-9])+((\.|-|_)[A-Za-z0-9]+)*((\.[A-Za-z0-9]{2,4}){1,2})$/, emptyTip: "请填写您注册时使用的邮箱，否则无法帮您找回密码", errorTip: "邮箱格式不正确，正确格式如：username@companyname.com", errorTip2: "请填写您注册时使用的邮箱", errorTip3: "邮箱不是公司邮箱", errorTip4: "用户不存在"}}, formItemTip_JT = {mail: {patten: /^([a-zA-Z0-9][_\.\-]*)+$/, errorTip: "邮箱格式不正确", errorTip1: "邮箱不是企业邮箱", errorTip2: "用户存在，请直接登录", errorTip3: "请输入你的企业邮箱"}};
SelectTenant.prototype = {define: function () {
    this.id = this.conf.id, this.wrap = $(this.conf.wrap), this.dom = [], this.dom.tntItem = $(this.wrap.find("ul.tenantlist li a")), this.dom.tntchecked = $(this.wrap.find("input#e")), this.dom.tntdefine = $(this.wrap.find('input[name = "encTenantId"]')), this.dom.submit = $(this.wrap.find("#postBtn")), this.activePublish = activePublish, this.maskPublish = maskPublish
}, choose: function () {
    var e = this;
    this.dom.tntItem.bind("click", function () {
        var t = $(this);
        e.dom.tntItem.removeClass("current"), t.addClass("current"), e.activePublish(e.dom.submit), e.dom.tntdefine.attr("value", t.attr("val"))
    })
}, submit: function () {
    var e = this;
    this.dom.submit.bind("click", function () {
        e.wrap.submit()
    })
}}, SubmibPersonalInfo.prototype = {initInput: function () {
    var e = {
        email: {
            patten: /^([a-zA-Z0-9][_\.\-]*)+\@([A-Za-z0-9])+((\.|-|_)[A-Za-z0-9]+)*((\.[A-Za-z0-9]{2,4}){1,2})$/,
            remindTip: "请输入您的常用邮箱<br><em>正确格式如xxx@xxx.xxx<em>",
            rightTip: "",
            errorTip: "格式不正确，正确格式如xxx@xxx.xxx",
            warmTip1: "请使用公司邮箱注册",
            warmTip2: "此邮箱已注册过，请直接登录"
        },
        companyName: {
            patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/,
            remindTip: "请填写您的企业中文名称<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>",
            rightTip: "",
            errorTip: "允许1-20位中文、字母、数字、下划线、圆点、圆括号"
        },
        domain: {
            patten: /^([0-9a-zA-Z_]){1,20}$/,
            remindTip: "请填写您企业名称的拼音或英文名<br><em>允许1-20位字母、数字、下划线<em>",
            rightTip: "",
            errorTip: "允许1-20位字母、数字、下划线"
        },
        name: {
            patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/,
            remindTip: "请填写您的姓名<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>",
            rightTip: "",
            errorTip: "允许1-20位中文、字母、数字、下划线、圆点、圆括号"
        },
        password: {
            patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/,
            remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>",
            rightTip: "",
            errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写"
        },
        againpassword: {
            patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/,
            remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>",
            rightTip: "",
            errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写",
            errorTip2: "与第一次输入不相同，请重新输入"
        },
        phone: {
            patten: /^1((3[0-9])|(5[012356789])|(8[012356789])|(4[7]))\d{8}$/,
            remindTip: '<span class="tn-pop-remind">请填写您的手机号码<br><em>允许11位数字</em></span>',
            rightTip: "",
            errorTip: '请填写正确的手机号码'
        },
        department: {
            patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/,
            remindTip: "请填写您的部门信息<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>",
            rightTip: "",
            errorTip: "请填写您的部门信息<br>允许1-20位中文、字母、数字、下划线、圆点、圆括号"
        },
        position: {
            patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/,
            remindTip: "请填写您的职位信息<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>",
            rightTip: "",
            errorTip: "请填写您的职位信息<br>允许1-20位中文、字母、数字、下划线、圆点、圆括号"
        }, util: {
            remind: "",
            rightTip: '<div class="right_validttip"></div>',
            errorTip: "",
            tipDom: ['<div class="validttipwrap">',
                '	<div class="validttip">',
                '		<div class="box_validttip">',
                '			<div class="outer_alidttip">',
                '				<div class="inner_alidttip"></div>',
                "			</div>", "		</div>", "	</div>", "</div>"]}};
        window.WPI_companyName = new FormInputValidate({id: "companyName", input: "#companyName", formItemTip: e.companyName, formItemUtil: e.util});
        window.WPI_domain = new FormInputValidate({id: "domain", input: "#domain", formItemTip: e.domain, formItemUtil: e.util});
        window.WPI_name = new FormInputValidate({id: "name", input: "#name", formItemTip: e.name, formItemUtil: e.util}),
        window.WPI_password = new FormInputValidate({id: "password", input: "#password", formItemTip: e.password, formItemUtil: e.util}),
        window.WPI_againpassword = new FormInputValidate({id: "againpassword", input: "#againpassword", formItemTip: e.againpassword, formItemUtil: e.util}),
        window.WPI_phone = new FormInputValidate({id: "phone", input: "#phone", formItemTip: e.phone, formItemUtil: e.util}),
        window.WPI_department = new FormInputValidate({id: "department", input: "#department", formItemTip: e.department, formItemUtil: e.util, norequire: 1}),
        window.WPI_position = new FormInputValidate({id: "position", input: "#position", formItemTip: e.position, formItemUtil: e.util, norequire: 1}),

        WPI_password.eFun.inputblExtra = this.validatePw,
        WPI_againpassword.eFun.inputblExtra = this.validateAgainPw,
        window.WPI_name.dom.input.attr("maxlength", "20"),
        window.WPI_password.dom.input.attr("maxlength", "20"),
        window.WPI_againpassword.dom.input.attr("maxlength", "20"),
        window.WPI_phone.dom.input.attr("maxlength", "11"),
        window.WPI_department.dom.input.attr("maxlength", "20"),
        window.WPI_position.dom.input.attr("maxlength", "20"),
        window.WPI_name.eFun.inputkyExtra = validateMaxKeyupWPI,
        window.WPI_password.eFun.inputkyExtra = validateMaxKeyupWPI,
        window.WPI_againpassword.eFun.inputkyExtra = validateMaxKeyupWPI,
        window.WPI_phone.eFun.inputkyExtra = validateMaxKeyupWPI,
        window.WPI_department.eFun.inputkyExtra = validateMaxKeyupWPI,
        window.WPI_position.eFun.inputkyExtra = validateMaxKeyupWPI,
        $("#email").length && (window.WPI_email = new FormInputValidate({id: "email", input: "#email", formItemTip: e.email, formItemUtil: e.util}),
            WPI_email.eFun.inputkyExtra = validateMaxKeyupWPI,
            WPI_email.eFun.inputblExtra = this.validateEM)
}, submitData: function () {
    var e = this;
    $("#submitPersonalInfo").bind("click", function () {
        var t = $(this);
        WPI_name.dom.input.val() == "" && WPI_name.eFun.inputbl(), WPI_password.dom.input.val() == "" && WPI_password.eFun.inputbl(), WPI_againpassword.dom.input.val() == "" && WPI_againpassword.eFun.inputbl(), WPI_phone.dom.input.val() == "" && (WPI_phone.pass = !0), WPI_department.dom.input.val() == "" && (WPI_department.pass = !0), WPI_position.dom.input.val() == "" && (WPI_position.pass = !0);
        var n = WPI_name.pass, r = WPI_password.pass && WPI_password.eFun.inputblExtra(), i = WPI_againpassword.pass && WPI_againpassword.eFun.inputblExtra(), s = WPI_phone.pass, o = WPI_department.pass, u = WPI_position.pass;
        if ($("#email").length) {
            WPI_email.dom.input.val() == "" && WPI_email.eFun.inputbl();
            var a = WPI_email.pass, f = a && n && r && i && s && o && u
        } else var f = n && r && i && s && o && u;
        if (!f)return!1;
        e.form.submit(), t.css("background", "#C5C5C5"), t.find("span").text("正在提交")
    })
}, validatePw: function () {
    var e = this.dom.input.val();
    return e != $("#againpassword").val() && $("#againpassword").val() != "" ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}, validateAgainPw: function () {
    var e = this.dom.input.val();
    return e != $("#password").val() ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}, validateEM: function () {
    var e = $.trim(this.dom.input.val()), t = this, n = this.pass;
    n && $.ajax({type: "GET", url: G_Info.checkEmailUrl + "?v=" + (new Date).getTime(), dataType: "json", data: {email: e}, success: function (e) {
        if (e.Result == 1)return t.pass = !0, !0;
        if (e.Msg.Status == -1)return t.dom.iptprt.addClass(t.sty.error), t.showtip({text: t.formItemTip.warmTip1, error: !0}), t.pass = !1, !1;
        if (e.Msg.Status == -2)return t.dom.iptprt.addClass(t.sty.error), t.showtip({text: t.formItemTip.warmTip2, error: !0}), t.pass = !1, !1
    }})
}}, SubmibTenantInfo.prototype = {initInput: function () {
    this.limitShortnameLength();
    var e = {company: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z（）()]){1,20}$/, remindTip: "请输入企业名称<br><em>允许1-20位，中文、英文、数字和圆括号<em>", rightTip: "", errorTip: "允许中文、英文、数字和圆括号<br><em>最多20个字<em>"}, shortname: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z()（）]){1,12}$/, remindTip: '<span class="tn-pop-remind">该简称将显示在页面左上角logo区域<br><em>允许中文、字母、数字、圆括号，最多6个字</em></span>', rightTip: "", errorTip: '<span for="Name" generated="true" class="tn-pop-error" style="display:block">允许中文、字母、数字、圆括号，最多6个字</span>'}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}};
    window.STI_company = new FormInputValidate({id: "company", input: "#companyName", formItemTip: e.company, formItemUtil: e.util}), window.STI_shortname = new FormInputValidate({id: "companyShortName", input: "#companyShortName", formItemTip: e.shortname, formItemUtil: e.util, norequire: 1}), window.STI_company.eFun.inputblExtra = this.iptBlurExtra, window.STI_company.dom.input.attr("maxlength", "20"), window.STI_company.eFun.inputkyExtra = validateMaxKeyupSTI, window.STI_shortname.eFun.inputkyExtra = validateMaxKeyupSTI
}, iptKeyupExtra: function () {
    window.STI_shortname.dom.input.val() == "" && (window.STI_shortname.pass = !0);
    var e = window.STI_company.pass, t = window.STI_shortname.pass, n = e && t;
    n ? activePublish($("#submitTenant")) : maskPublish($("#submitTenant"))
}, iptBlurExtra: function () {
    var e = STI_shortname.dom.input, t = STI_company.dom.input.val();
    e.val() == "" && (e.val(getByteVal(t, 12)), e.trigger("blur"))
}, submitData: function () {
    var e = this;
    this.submitBtn.bind("click", function () {
        STI_company.dom.input.val() == "" && STI_company.eFun.inputbl(), STI_shortname.dom.input.val() == "" && (STI_shortname.pass = !0);
        var t = STI_company.pass, n = STI_shortname.pass, r = t && n;
        if (!r)return!1;
        e.form.submit()
    })
}, limitShortnameLength: function () {
    var e = $("#companyShortName"), t = 12, n = this;
    e.bind("keyup change", function () {
        var e = $.trim($(this).val());
        $(this).val(getByteVal(e, t))
    })
}}, SendMailAgain.prototype = {submit: function () {
    var e = this;
    $("#sendMailAgain").bind("click", function () {
        var t = $(this);
        getXSSAjax(function () {
            e.ajaxDara(t)
        }, (bs_tita.webapi || "http://webapi.tita.com") + "/iframe.html")
    })
}, ajaxDara: function (e) {
    $.ajax({type: "POST", url: bs_tita.webapi + G_Info.ActiveUser + "?v=" + (new Date).getTime(), dataType: "json", data: {encEmail: G_Info.encEmail}, success: function (t) {
        t.Data ? DialogT.show(e, {sureHide: !1, cancelHide: !1, text: "发送成功", autoHide: !0, verifyClass: "yes_verify"}) : DialogT.show(e, {sureHide: !1, cancelHide: !1, text: "发送失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"})
    }, error: function () {
        DialogT.show(e, {sureHide: !1, cancelHide: !1, text: "发送失败，请重新操作", autoHide: !0, verifyClass: "warm_verify"})
    }})
}}, SubmibTaobaoUserInfo.prototype = {initInput: function () {
    var e = {company: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z（）()]){1,20}$/, remindTip: "请输入企业或团队名称<br><em>允许1-20位，中文、英文、数字和圆括号<em>", rightTip: "", errorTip: "允许中文、英文、数字和圆括号<br><em>最多20个字<em>"}, username: {patten: /^([\u4E00-\u9FA5]|[0-9a-zA-Z_\.()（）]){1,20}$/, remindTip: "请填写您的姓名<br><em>允许1-20位中文、字母、数字、下划线、圆点、圆括号<em>", rightTip: "", errorTip: "允许1-20位中文、字母、数字、下划线、圆点、圆括号"}, email: {patten: /^([a-zA-Z0-9][_\.\-]*)+\@([A-Za-z0-9])+((\.|-|_)[A-Za-z0-9]+)*((\.[A-Za-z0-9]{2,4}){1,2})$/, remindTip: "请输入您的常用邮箱<br><em>正确格式如xxx@xxx.xxx<em>", rightTip: "", errorTip: "格式不正确，正确格式如xxx@xxx.xxx", warmTip1: "请使用公司邮箱注册", warmTip2: "此邮箱已注册过，请直接登录"}, password: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写"}, againpassword: {patten: /^([\x21-\x3b]|\x3d|[\x3f-\x7e]){6,20}$/, remindTip: "请输入新密码<br><em>长度在6-20位之间，允许字母、数字和特殊字符，<>除外<em>", rightTip: "", errorTip: "长度在6-20位之间，允许字母、数字、特殊字符，<>除外，区分大小写", errorTip2: "与第一次输入不相同，请重新输入"}, taemail: {patten: /^([a-zA-Z0-9][_\.\-]*)+\@([A-Za-z0-9])+((\.|-|_)[A-Za-z0-9]+)*((\.[A-Za-z0-9]{2,4}){1,2})$/, remindTip: "请输入ta的邮箱<br><em>正确格式如xxx@xxx.xxx<em>", rightTip: "", errorTip: "格式不正确，正确格式如xxx@xxx.xxx", warmTip1: "请使用公司邮箱注册", warmTip2: "此邮箱已注册过，请直接登录"}, util: {remind: "", rightTip: '<div class="right_validttip"></div>', errorTip: "", tipDom: ['<div class="validttipwrap">', '	<div class="validttip">', '		<div class="box_validttip">', '			<div class="outer_alidttip">', '				<div class="inner_alidttip"></div>', "			</div>", "		</div>", "	</div>", "</div>"]}};
    window.STUI_company = new FormInputValidate({id: "company", input: "#companyName", formItemTip: e.company, formItemUtil: e.util}), window.STUI_username = new FormInputValidate({id: "username", input: "#username", formItemTip: e.username, formItemUtil: e.util}), window.STUI_email = new FormInputValidate({id: "email", input: "#Email", formItemTip: e.email, formItemUtil: e.util}), STUI_email.eFun.inputkyExtra = validateMaxKeyupRTP, window.STUI_username.dom.input.trigger("focus").trigger("blur"), window.STUI_company.dom.input.trigger("focus").trigger("blur")
}, submitData: function () {
    var e = this;
    $("#submitPersonalInfo").bind("click", function () {
        var t = $(this);
        STUI_company.dom.input.val() == "" && STUI_company.eFun.inputbl(), STUI_username.dom.input.val() == "" && STUI_username.eFun.inputbl(), STUI_email.dom.input.val() == "" && STUI_email.eFun.inputbl();
        var n = STUI_email.pass, r = STUI_username.pass, i = STUI_company.pass, s = i && r && n;
        if (!s)return!1;
        e.form.submit(), t.css("background", "#C5C5C5"), t.find("span").text("正在提交")
    })
}, validatePw: function () {
    var e = this.dom.input.val();
    return e != $("#againpassword").val() && $("#againpassword").val() != "" ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}, validateAgainPw: function () {
    var e = this.dom.input.val();
    return e != $("#password").val() ? (this.dom.iptprt.addClass(this.sty.error), this.showtip({text: this.formItemTip.errorTip2, error: !0}), !1) : !0
}, validateEM: function () {
    var e = $.trim(this.dom.input.val()), t = this, n = this.pass;
    n && $.ajax({type: "GET", url: G_Info.checkEmailUrl + "?v=" + (new Date).getTime(), dataType: "json", data: {email: e}, success: function (e) {
        if (e.Result == 1)return t.pass = !0, !0;
        if (e.Msg.Status == -1)return t.dom.iptprt.addClass(t.sty.error), t.showtip({text: t.formItemTip.warmTip1, error: !0}), t.pass = !1, !1;
        if (e.Msg.Status == -2)return t.dom.iptprt.addClass(t.sty.error), t.showtip({text: t.formItemTip.warmTip2, error: !0}), t.pass = !1, !1
    }})
}};
