import XCTest

final class SixHopsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    func capture(_ app: XCUIApplication, _ name: String) {
        let image = XCTAttachment(screenshot: app.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }
    func testFiveLanguageHomesAndSettings() {
        let cases = [("ja", "遊ぶ", "設定", "記録"), ("en", "Play", "Settings", "History"), ("zh", "开始", "设置", "记录"), ("de", "Spielen", "Einstellungen", "Verlauf"), ("fr", "Jouer", "Réglages", "Historique")]
        for (code, play, settings, history) in cases {
            let app = XCUIApplication()
            app.launchArguments = ["-sixhops.language", code]
            app.launch()
            XCTAssertTrue(app.buttons["mode-0"].waitForExistence(timeout: 10))
            XCTAssertTrue(app.buttons[play].exists)
            capture(app, "\(code)-home")
            app.buttons.matching(identifier: settings).firstMatch.tap()
            capture(app, "\(code)-settings")
            app.buttons.matching(identifier: history).firstMatch.tap()
            capture(app, "\(code)-history")
            app.terminate()
        }
    }
    func testLiveDailyChallenge() {
        let app = XCUIApplication()
        app.launchArguments = ["-sixhops.language", "en"]
        app.launch()
        XCTAssertTrue(app.buttons["mode-0"].waitForExistence(timeout: 10))
        app.buttons["mode-0"].tap()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.waitForExistence(timeout: 10))
        XCTAssertTrue(web.buttons["START"].waitForExistence(timeout: 40), app.debugDescription)
        XCTAssertTrue(web.buttons["START"].isHittable)
        capture(app, "en-daily-ready")
        web.buttons["START"].tap()
        XCTAssertTrue(app.staticTexts["0 / 6 HOPS"].waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.buttons["Hint and route"].exists)
        let articlesLoaded = NSPredicate(format: "count > 5")
        expectation(for: articlesLoaded, evaluatedWith: web.links)
        waitForExpectations(timeout: 30)
        capture(app, "en-daily-playing")
        app.buttons["Hint and route"].tap()
        XCTAssertTrue(app.navigationBars["Hint and route"].waitForExistence(timeout: 10))
        capture(app, "en-daily-route")
    }
    func testLocalizedGameModes() {
        for (code, randomStart) in [("ja", "止める"), ("en", "Stop"), ("zh", "停止"), ("de", "Stoppen"), ("fr", "Arrêter")] {
            for mode in 0..<3 {
                let app = XCUIApplication()
                app.launchArguments = ["-sixhops.language", code]
                app.launch()
                XCTAssertTrue(app.buttons["mode-\(mode)"].waitForExistence(timeout: 10))
                app.buttons["mode-\(mode)"].tap()
                let web = app.webViews.firstMatch
                XCTAssertTrue(web.waitForExistence(timeout: 10))
                if mode == 2 {
                    expectation(for: NSPredicate(format: "count == 2"), evaluatedWith: web.searchFields)
                    waitForExpectations(timeout: 40)
                } else {
                    let start = web.buttons[mode == 0 ? (["zh": "开始", "fr": "DÉMARRER"][code] ?? "START") : randomStart]
                    XCTAssertTrue(start.waitForExistence(timeout: 40), app.debugDescription)
                }
                capture(app, "\(code)-mode-\(mode)")
                app.terminate()
            }
        }
    }
    func testCustomGameSavesSuccess() {
        let app = XCUIApplication()
        app.launchArguments = ["-sixhops.language", "en"]
        app.launch()
        app.buttons["mode-2"].tap()
        let web = app.webViews.firstMatch
        expectation(for: NSPredicate(format: "count == 2"), evaluatedWith: web.searchFields)
        waitForExpectations(timeout: 40)
        for (index, article) in ["Earth", "Moon"].enumerated() {
            let field = web.searchFields.element(boundBy: index)
            field.tap()
            field.typeText(article)
            let suggestions = web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", article))
            expectation(for: NSPredicate { _, _ in suggestions.allElementsBoundByIndex.contains(where: { $0.isHittable }) }, evaluatedWith: nil)
            waitForExpectations(timeout: 30)
            guard let suggestion = suggestions.allElementsBoundByIndex.first(where: { $0.isHittable }) else { XCTFail(app.debugDescription); return }
            suggestion.tap()
        }
        if app.buttons["Done"].firstMatch.exists { app.buttons["Done"].firstMatch.tap() }
        web.buttons["START"].tap()
        let moon = web.links["Moon"].firstMatch
        XCTAssertTrue(moon.waitForExistence(timeout: 30), app.debugDescription)
        moon.tap()
        XCTAssertTrue(web.staticTexts["Success"].waitForExistence(timeout: 30), app.debugDescription)
        capture(app, "en-success")
        app.navigationBars.buttons["Close"].tap()
        app.buttons.matching(identifier: "Close").element(boundBy: app.buttons.matching(identifier: "Close").count - 1).tap()
        app.buttons["History"].tap()
        XCTAssertTrue(app.staticTexts["Earth → Moon"].waitForExistence(timeout: 10), app.debugDescription)
        capture(app, "en-history-result")
    }

    func testRecordDailyVideo() throws {
        let env = ProcessInfo.processInfo.environment
        let locale = try XCTUnwrap(env["SIXHOPS_VIDEO_LOCALE"])
        let date = try XCTUnwrap(env["SIXHOPS_VIDEO_DATE"])
        let encoded = try XCTUnwrap(env["SIXHOPS_VIDEO_ROUTE"])
        let data = try XCTUnwrap(Data(base64Encoded: encoded))
        let route = try JSONDecoder().decode([String].self, from: data)
        XCTAssertTrue((2...7).contains(route.count))
        func mark(_ stage: String, _ index: Int = 0) {
            if stage != "tap" && stage != "done" {
                print("SIXHOPS_SCREEN " + stage + " " + String(index) + " " + XCUIScreen.main.screenshot().pngRepresentation.base64EncodedString())
            }
            let event: [String: Any] = ["stage": stage, "index": index, "epoch": Date().timeIntervalSince1970]
            let json = try! JSONSerialization.data(withJSONObject: event, options: .sortedKeys)
            print("SIXHOPS_EVENT " + String(data: json, encoding: .utf8)!)
        }
        let app = XCUIApplication()
        app.launchArguments = ["-sixhops.language", locale, "-video-date", date, "-video-route", encoded]
        app.launch()
        XCTAssertTrue(app.buttons["mode-0"].waitForExistence(timeout: 15))
        mark("home"); Thread.sleep(forTimeInterval: 2)
        app.buttons["mode-0"].tap()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.buttons["START"].waitForExistence(timeout: 45), app.debugDescription)
        XCTAssertTrue(web.staticTexts[route[0]].firstMatch.exists, app.debugDescription)
        XCTAssertTrue(web.staticTexts[route.last!].firstMatch.exists, app.debugDescription)
        mark("ready"); Thread.sleep(forTimeInterval: 2)
        web.buttons["START"].tap()
        for i in 1..<route.count {
            let link = web.links["video-next-link-\(i - 1)"].firstMatch
            XCTAssertTrue(link.waitForExistence(timeout: 40), app.debugDescription)
            XCTAssertTrue(link.isHittable, app.debugDescription)
            XCTAssertTrue(web.staticTexts[route[i - 1]].firstMatch.exists)
            XCTAssertTrue(app.staticTexts["\(i - 1) / 6 HOPS"].exists)
            mark("article", i - 1); Thread.sleep(forTimeInterval: 3)
            mark("tap", i); link.tap()
            if i < route.count - 1 {
                XCTAssertTrue(app.staticTexts["\(i) / 6 HOPS"].waitForExistence(timeout: 40), app.debugDescription)
            }
        }
        let success = locale == "ja" ? "成功" : "Success"
        XCTAssertTrue(web.staticTexts[success].waitForExistence(timeout: 40), app.debugDescription)
        capture(app, "video-\(locale)-success")
        mark("result", route.count - 1); Thread.sleep(forTimeInterval: 3)
        mark("done")
    }

}
