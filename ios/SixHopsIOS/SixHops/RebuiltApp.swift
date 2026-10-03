import SwiftUI
import WebKit

struct Language: Identifiable, Hashable {
    let id: String
    let name: String
    let words: [String]
    static let all: [Language] = [
        .init(id: "ja", name: "日本語", words: ["遊ぶ", "記録", "設定", "6つのリンクで、世界をつなぐ。", "デイリー", "ランダム", "カスタム", "今日のお題に挑戦", "偶然の出会いを楽しむ", "出発点とゴールを選ぶ", "言語", "プレイ記録はまだありません", "成功", "挑戦終了", "閉じる", "再読み込み", "読み込めませんでした。接続を確認してください。", "共有", "Wikipediaの記事リンクをたどり、6回以内にゴールへ。", "プライバシーポリシー", "ゴール", "ヒントと経路", "戻ると経路が変更されます", "キャンセル", "ゲームを終了しますか？途中の進行は保存されません。"]),
        .init(id: "en", name: "English", words: ["Play", "History", "Settings", "Connect the world in six links.", "Daily", "Random", "Custom", "Try today's challenge", "Discover an unexpected connection", "Choose your start and goal", "Language", "No games yet", "Success", "Challenge finished", "Close", "Reload", "Unable to load. Check your connection.", "Share", "Follow Wikipedia links to reach your goal within six hops.", "Privacy policy", "Goal", "Hint and route", "Going back changes your route", "Cancel", "End this game? Your current progress will not be saved."]),
        .init(id: "zh", name: "中文", words: ["开始", "记录", "设置", "用六次跳转，连接世界。", "每日挑战", "随机", "自定义", "挑战今日题目", "发现意想不到的联系", "选择起点和终点", "语言", "暂无游戏记录", "成功", "挑战结束", "关闭", "重新加载", "无法加载，请检查网络连接。", "分享", "沿着维基百科链接，在六次跳转内到达目标。", "隐私政策", "目标", "提示和路径", "返回会改变路径", "取消", "结束游戏？当前进度不会保存。"]),
        .init(id: "de", name: "Deutsch", words: ["Spielen", "Verlauf", "Einstellungen", "Verbinde die Welt in sechs Links.", "Daily", "Zufall", "Eigene", "Die heutige Aufgabe", "Entdecke neue Verbindungen", "Wähle Start und Ziel", "Sprache", "Noch keine Spiele", "Erfolg", "Aufgabe beendet", "Schließen", "Neu laden", "Laden fehlgeschlagen. Prüfe deine Verbindung.", "Teilen", "Erreiche das Ziel über Wikipedia-Links in höchstens sechs Schritten.", "Datenschutz", "Ziel", "Hinweis und Route", "Zurückgehen ändert deine Route", "Abbrechen", "Spiel beenden? Dein Fortschritt wird nicht gespeichert."]),
        .init(id: "fr", name: "Français", words: ["Jouer", "Historique", "Réglages", "Reliez le monde en six liens.", "Daily", "Aléatoire", "Personnalisé", "Le défi du jour", "Découvrez des liens inattendus", "Choisissez le départ et l’arrivée", "Langue", "Aucune partie", "Réussite", "Défi terminé", "Fermer", "Recharger", "Chargement impossible. Vérifiez votre connexion.", "Partager", "Suivez les liens Wikipédia pour atteindre la cible en six étapes maximum.", "Confidentialité", "Cible", "Indice et parcours", "Revenir modifie votre parcours", "Annuler", "Terminer la partie ? La progression ne sera pas enregistrée."])
    ]
    static var initial: String {
        #if DEBUG
        if let index = ProcessInfo.processInfo.arguments.firstIndex(of: "-ui-language"), ProcessInfo.processInfo.arguments.count > index + 1 { return ProcessInfo.processInfo.arguments[index + 1] }
        #endif
        return all.first { Locale.preferredLanguages.first?.hasPrefix($0.id) == true }?.id ?? "en" }
    func text(_ index: Int) -> String { words[index] }
    func url(mode: Int) -> URL {
        let base = "https://myeik.net/6HOPS/" + (id == "ja" ? "" : "\(id)/")
        var url = URL(string: base + (mode == 2 ? "custom.html" : "index.html" + (mode == 1 ? "?mode=random" : "")))!
        #if DEBUG && targetEnvironment(simulator)
        let args = ProcessInfo.processInfo.arguments
        if mode == 0, let i = args.firstIndex(of: "-video-date"), args.count > i + 1 {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            components.queryItems = [URLQueryItem(name: "date", value: args[i + 1])]
            url = components.url!
        }
        #endif
        return url
    }
}

struct GameRecord: Codable, Identifiable {
    var id: String
    var date: Date
    var language: String
    var mode: Int
    var start: String
    var goal: String
    var hops: Int
    var success: Bool
}

@MainActor final class GameStore: ObservableObject {
    @Published var records: [GameRecord] = []
    init() { if let data = UserDefaults.standard.data(forKey: "sixhops.records"), let saved = try? JSONDecoder().decode([GameRecord].self, from: data) { records = saved } }
    func save(_ record: GameRecord) {
        guard !records.contains(where: { $0.id == record.id }) else { return }
        records.insert(record, at: 0)
        records = Array(records.prefix(300))
        if let data = try? JSONEncoder().encode(records) { UserDefaults.standard.set(data, forKey: "sixhops.records") }
    }
}

@main struct SixHopsApp: App {
    @StateObject private var store = GameStore()
    var body: some Scene {
        WindowGroup {
            HomeView().environmentObject(store)
#if DEBUG && targetEnvironment(simulator)
                // A two-pixel recording heartbeat keeps static native screens flowing to simctl.
                // It changes no layout, input, article content or game state.
                .overlay(alignment: .topLeading) {
                    if ProcessInfo.processInfo.arguments.contains("-video-date") {
                        TimelineView(.periodic(from: .now, by: 0.1)) { context in
                            Rectangle()
                                .fill(Int(context.date.timeIntervalSince1970 * 10) % 2 == 0 ? Color.black : Color.white)
                                .frame(width: 2, height: 2)
                                .allowsHitTesting(false)
                                .accessibilityHidden(true)
                        }
                    }
                }
#endif
        }
    }
}

struct LiveGameState: Codable {
    var started: Bool
    var hops: Int
    var goal: String
    var route: [String]
    var summary: String
}
struct GameSelection: Identifiable { let id = UUID(); let mode: Int; let language: Language }
struct HomeView: View {
    @AppStorage("sixhops.language") private var languageID = Language.initial
    @EnvironmentObject private var store: GameStore
    @State private var selection: GameSelection?
    private var language: Language { Language.all.first { $0.id == languageID } ?? Language.all[1] }
    var body: some View {
        TabView {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Text("6HOPS").font(.system(size: 54, weight: .black, design: .rounded))
                        Text(language.text(3)).font(.title2.bold())
                        Text(language.text(18)).foregroundStyle(.secondary)
                        ForEach(0..<3) { mode in
                            Button { selection = .init(mode: mode, language: language) } label: {
                                HStack(spacing: 18) {
                                    Image(systemName: ["calendar", "shuffle", "slider.horizontal.3"][mode]).font(.title2).frame(width: 36)
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(language.text(4 + mode)).font(.title3.bold())
                                        Text(language.text(7 + mode)).font(.subheadline)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                }.padding(22).foregroundStyle(mode == 0 ? Color.white : Color.primary)
                                    .background(mode == 0 ? Color.indigo : Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 24))
                            }.buttonStyle(.plain).accessibilityIdentifier("mode-\(mode)")
                        }
                    }.padding(24).frame(maxWidth: 700).frame(maxWidth: .infinity)
                }.background(Color(uiColor: .systemGroupedBackground)).navigationBarHidden(true)
            }.tabItem { Label(language.text(0), systemImage: "play.circle.fill") }
            NavigationStack {
                List {
                    if store.records.isEmpty { Text(language.text(11)).foregroundStyle(.secondary) }
                    ForEach(store.records) { record in
                        VStack(alignment: .leading, spacing: 8) {
                            Label(language.text(record.success ? 12 : 13), systemImage: record.success ? "checkmark.circle.fill" : "flag.fill").foregroundStyle(record.success ? .green : .secondary)
                            Text("\(record.start) → \(record.goal)").font(.headline)
                            Text("\(record.hops) HOPS · \(record.language.uppercased())").font(.caption)
                            Text(record.date, style: .date).font(.caption).foregroundStyle(.secondary)
                            ShareLink(item: "6HOPS: \(record.start) → \(record.goal) · \(record.hops) HOPS\nhttps://myeik.net/6HOPS/") { Label(language.text(17), systemImage: "square.and.arrow.up") }
                        }.padding(.vertical, 8)
                    }
                }.navigationTitle(language.text(1))
            }.tabItem { Label(language.text(1), systemImage: "chart.bar.fill") }
            NavigationStack {
                Form {
                    Picker(language.text(10), selection: $languageID) { ForEach(Language.all) { Text($0.name).tag($0.id) } }
                    Link(language.text(19), destination: URL(string: "https://myeik.net/privacy-policy.html")!)
                    Text("Wikipedia · CC BY-SA\n6HOPS").foregroundStyle(.secondary)
                }.navigationTitle(language.text(2))
            }.tabItem { Label(language.text(2), systemImage: "gearshape.fill") }
        }.tint(.indigo).fullScreenCover(item: $selection) { game in GameView(game: game).environmentObject(store) }
    }
}

@MainActor final class BrowserModel: ObservableObject {
    @Published var failed = false
    @Published var loading = true
    @Published var share: String?
    @Published var state: LiveGameState?
    let webView: WKWebView
    init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        webView = WKWebView(frame: .zero, configuration: configuration)
    }
    func load(_ url: URL) {
        loading = true
        failed = false
        // Install the rules before loading any remote content. Fail closed if compilation fails.
        let rules = #"[{"trigger":{"url-filter":"^https?://([^/]+\\.)?google\\-analytics\\.com/"},"action":{"type":"block"}},{"trigger":{"url-filter":"^https?://([^/]+\\.)?googletagmanager\\.com/"},"action":{"type":"block"}},{"trigger":{"url-filter":"^https?://([^/]+\\.)?doubleclick\\.net/"},"action":{"type":"block"}},{"trigger":{"url-filter":"^https?://([^/]+\\.)?googlesyndication\\.com/"},"action":{"type":"block"}},{"trigger":{"url-filter":"^https?://([^/]+\\.)?googleadservices\\.com/"},"action":{"type":"block"}}]"#
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "SixHopsPrivacy-v1", encodedContentRuleList: rules) { [weak self] ruleList, error in
            DispatchQueue.main.async {
                guard let self else { return }
                guard error == nil, let ruleList else {
                    self.loading = false
                    self.failed = true
                    return
                }
                self.webView.configuration.userContentController.add(ruleList)
                self.webView.load(URLRequest(url: url))
            }
        }
    }
}
struct GameView: View {
    let game: GameSelection
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: GameStore
    @StateObject private var browser = BrowserModel()
    @State private var showClose = false
    @State private var showRoute = false
    var body: some View {
        NavigationStack {
            ZStack {
                GameWebView(game: game, browser: browser, store: store)
                if browser.loading { ProgressView().padding(24).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18)) }
                if browser.failed {
                    ContentUnavailableView {
                        Label(game.language.text(16), systemImage: "wifi.exclamationmark")
                    } actions: {
                        Button(game.language.text(15)) { browser.load(game.language.url(mode: game.mode)) }
                    }.background(Color(uiColor: .systemBackground))
                }
            }.safeAreaInset(edge: .top, spacing: 0) {
                if let state = browser.state, state.started {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("\(state.hops) / 6 HOPS").font(.subheadline.bold()).monospacedDigit()
                            Spacer()
                            Button { showRoute = true } label: { Label(game.language.text(21), systemImage: "map") }.font(.subheadline)
                        }
                        HStack(spacing: 6) {
                            ForEach(0..<6) { index in Capsule().fill(index < state.hops ? Color.indigo : Color.indigo.opacity(0.12)).frame(height: 5) }
                        }.accessibilityHidden(true)
                        Text(game.language.text(20) + ": " + state.goal).font(.subheadline).lineLimit(2)
                    }.padding(.horizontal, 20).padding(.vertical, 12).background(.regularMaterial)
                }
            }.sheet(isPresented: $showRoute) {
                NavigationStack {
                    List {
                        if let state = browser.state {
                            Section(game.language.text(20) + ": " + state.goal) { Text(state.summary) }
                            Section(game.language.text(22)) {
                                ForEach(Array(state.route.enumerated()), id: \.offset) { index, title in
                                    Button {
                                        browser.webView.evaluateJavaScript("returnToHistoryIndex(\(index))")
                                        showRoute = false
                                    } label: { HStack { Text("\(index)").monospacedDigit(); Text(title); Spacer(); if index == state.hops { Image(systemName: "location.fill") } } }
                                }
                            }
                        }
                    }.navigationTitle(game.language.text(21)).toolbar { Button(game.language.text(14)) { showRoute = false } }
                }.presentationDetents([.medium, .large])
            }.navigationTitle(game.language.text(4 + game.mode)).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) { Button(game.language.text(14)) { showClose = true } }
                    ToolbarItem(placement: .topBarTrailing) { if let share = browser.share { ShareLink(item: share) { Image(systemName: "square.and.arrow.up") } } }
                }
                .confirmationDialog(game.language.text(24), isPresented: $showClose, titleVisibility: .visible) {
                    Button(game.language.text(14), role: .destructive) { dismiss() }
                    Button(game.language.text(23), role: .cancel) {}
                }
        }
    }
}

struct GameWebView: UIViewRepresentable {
    let game: GameSelection
    let browser: BrowserModel
    let store: GameStore
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> WKWebView {
        let web = browser.webView
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.configuration.userContentController.add(context.coordinator, name: "sixhops")
        web.configuration.userContentController.addUserScript(WKUserScript(source: Self.bridge, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        #if DEBUG && targetEnvironment(simulator)
        // Recording support only scrolls/highlights an existing article anchor.
        // XCTest taps that real anchor; it never changes game state or article content.
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-video-route"), args.count > i + 1,
           let data = Data(base64Encoded: args[i + 1]),
           let route = try? JSONSerialization.jsonObject(with: data) as? [String] {
            let json = String(data: try! JSONSerialization.data(withJSONObject: route), encoding: .utf8)!
            let script = """
            (() => {
              const route = \(json); let last = '';
              setInterval(() => {
                if (typeof clickCount === 'undefined' || typeof gameStarted === 'undefined' || !gameStarted) return;
                const heading = document.querySelector('.wikiBlock > h2');
                if (!heading || heading.textContent.trim() !== route[clickCount]) return;
                const title = route[clickCount + 1];
                if (!title || last === title) return;
                const a = [...document.querySelectorAll('.wikiBlock a[title]')].find(a => a.title === title && a.getClientRects().length);
                if (!a) return;
                a.setAttribute('aria-label','video-next-link-' + clickCount);
                a.style.background = '#eaf3ff'; a.style.outline = '3px solid #3366cc';
                a.scrollIntoView({block:'center',behavior:'instant'}); last = title;
              }, 250);
            })();
            """
            web.configuration.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        }
        #endif
        browser.load(game.language.url(mode: game.mode))
        return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.stopLoading()
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "sixhops")
        uiView.navigationDelegate = nil
        uiView.uiDelegate = nil
    }
    static let bridge = """
    (() => {
      const send = data => window.webkit.messageHandlers.sixhops.postMessage(data);
      const style = document.createElement('style');
      style.textContent = '.fixedScreen,.desktopTracker,.randomModeButton,.customModeButton,.aboutLink,.kofiButton,.shareButton{display:none!important} body{padding-top:16px!important} .wikiBlock{width:auto!important;margin:12px!important;border:0!important;border-radius:18px} .start,.hintBlock,.homeLink,.menuIcon{touch-action:manipulation}';
      document.head.appendChild(style);
      let installed = false;
      let run = String(Date.now());
      const timer = setInterval(() => {
        if (typeof displayResult !== 'function') return;
        if (installed) return; installed = true; clearInterval(timer);
        let round = 0;
        const begin = beginChallengeGame;
        window.beginChallengeGame = function() { round++; return begin.apply(this, arguments); };
        const original = displayResult;
        window.displayResult = function(result) {
          original.apply(this, arguments);
          send({type:'result',id:run + ':' + round,start: String(startArticleTitle || ''),goal:String(targetArticleTitleB || ''),hops:clickCount,success:result==='success'});
        };
      }, 200);
      setTimeout(() => clearInterval(timer), 30000);
      let previous = '';
      setInterval(() => {
        if (typeof gameStarted === 'undefined') return;
        const state = {type:'state',started:gameStarted,hops:clickCount,goal:targetArticleTitleB || '',route:Array.from(history || []).filter(x => typeof x === 'string'),summary:document.querySelector('.goalSummary')?.textContent || ''};
        const serialized = JSON.stringify(state);
        if (serialized !== previous) { previous = serialized; send(state); }
      }, 500);
      document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a && a.href.includes('twitter.com/intent/')) {
          e.preventDefault(); e.stopPropagation();
          const u = new URL(a.href); send({type:'share',text:(u.searchParams.get('text') || '') + '\\n' + (u.searchParams.get('url') || '')});
        }
      }, true);
    })();
    """
    @MainActor final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        let parent: GameWebView
        var resultID = UUID().uuidString
        init(_ parent: GameWebView) { self.parent = parent }
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) { parent.browser.loading = true; parent.browser.failed = false; resultID = UUID().uuidString }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { parent.browser.loading = false }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail(error) }
        func fail(_ error: Error) { guard (error as NSError).code != NSURLErrorCancelled else { return }; parent.browser.loading = false; parent.browser.failed = true }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "https", url.host == "myeik.net", url.path.hasPrefix("/6HOPS/") { decisionHandler(.allow) }
            else { decisionHandler(.cancel); if navigationAction.navigationType == .linkActivated, ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) } }
        }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame, message.frameInfo.securityOrigin.host == "myeik.net", let data = message.body as? [String: Any] else { return }
            if data["type"] as? String == "state", let json = try? JSONSerialization.data(withJSONObject: data), let state = try? JSONDecoder().decode(LiveGameState.self, from: json) {
                parent.browser.state = state
                return
            }
            if data["type"] as? String == "share", let text = data["text"] as? String { parent.browser.share = text
                if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene, var controller = scene.windows.first(where: \.isKeyWindow)?.rootViewController {
                    while let next = controller.presentedViewController { controller = next }
                    let sheet = UIActivityViewController(activityItems: [text], applicationActivities: nil)
                    sheet.popoverPresentationController?.sourceView = controller.view
                    controller.present(sheet, animated: true)
                }
                return }
            guard data["type"] as? String == "result", let round = data["id"] as? String, let start = data["start"] as? String, let goal = data["goal"] as? String, let hops = data["hops"] as? Int, (0...6).contains(hops), let success = data["success"] as? Bool else { return }
            parent.store.save(.init(id: resultID + round, date: Date(), language: parent.game.language.id, mode: parent.game.mode, start: start, goal: goal, hops: hops, success: success))
            parent.browser.share = "6HOPS: \(start) → \(goal) · \(hops) HOPS\n\(parent.game.language.url(mode: parent.game.mode))"
            UINotificationFeedbackGenerator().notificationOccurred(success ? .success : .warning)
        }
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            present(message: message, confirm: false) { _ in completionHandler() }
        }
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            present(message: message, confirm: true, completion: completionHandler)
        }
        func present(message: String, confirm: Bool, completion: @escaping (Bool) -> Void) {
            guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene, var controller = scene.windows.first(where: \.isKeyWindow)?.rootViewController else { completion(false); return }
            while let next = controller.presentedViewController { controller = next }
            let alert = UIAlertController(title: "6HOPS", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completion(true) })
            if confirm { alert.addAction(UIAlertAction(title: parent.game.language.text(23), style: .cancel) { _ in completion(false) }) }
            controller.present(alert, animated: true)
        }
    }
}
