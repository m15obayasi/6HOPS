import AppKit
let input = URL(fileURLWithPath:CommandLine.arguments[1])
let config = try! JSONSerialization.jsonObject(with:Data(contentsOf:input)) as! [String:Any]
let directory = config["directory"] as! String
try! FileManager.default.createDirectory(atPath:directory,withIntermediateDirectories:true)
func text(_ value:String, rect:NSRect, size:CGFloat, color:NSColor, bold:Bool=true) {
    let paragraph=NSMutableParagraphStyle(); paragraph.alignment = .center; paragraph.lineBreakMode = .byWordWrapping
    var fittedSize=size
    func attributed(_ pointSize:CGFloat)->NSAttributedString {
        let font=bold ? NSFont.boldSystemFont(ofSize:pointSize) : NSFont.systemFont(ofSize:pointSize)
        return NSAttributedString(string:value,attributes:[.font:font,.foregroundColor:color,.paragraphStyle:paragraph])
    }
    var str=attributed(fittedSize)
    var bounds=str.boundingRect(with:NSSize(width:rect.width,height:10000),options:[.usesLineFragmentOrigin,.usesFontLeading])
    while bounds.height>rect.height && fittedSize>24 {
        fittedSize-=2;str=attributed(fittedSize)
        bounds=str.boundingRect(with:NSSize(width:rect.width,height:10000),options:[.usesLineFragmentOrigin,.usesFontLeading])
    }
    str.draw(in:NSRect(x:rect.minX,y:rect.midY-bounds.height/2,width:rect.width,height:bounds.height))
}
func image(_ name:String, width:Int=1080,height:Int=1920,_ draw:()->Void) {
    let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
    let context=NSGraphicsContext(bitmapImageRep:bitmap)!
    NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current=context
    NSColor.clear.setFill();NSRect(x:0,y:0,width:CGFloat(width),height:CGFloat(height)).fill();draw()
    NSGraphicsContext.restoreGraphicsState()
    try! bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:directory+"/"+name+".png"))
}
let start=config["start"] as! String;let goal=config["goal"] as! String
func title(_ w:CGFloat,_ h:CGFloat){
    NSColor(calibratedWhite:0.98,alpha:1).setFill();NSRect(x:0,y:0,width:w,height:h).fill()
    let color=NSColor(calibratedWhite:0.13,alpha:1)
    if h>w {
        text("6HOPS",rect:NSRect(x:60,y:1350,width:960,height:220),size:156,color:color)
        text(start+"\n↓\n"+goal,rect:NSRect(x:90,y:380,width:900,height:830),size:128,color:color)
    } else {
        text("6HOPS",rect:NSRect(x:80,y:490,width:w-160,height:140),size:90,color:color)
        text(start+"\n↓\n"+goal,rect:NSRect(x:80,y:40,width:w-160,height:440),size:92,color:color)
    }
}
image("title"){title(1080,1920)}
image("thumbnail",width:1280,height:720){title(1280,720)}
let captions=config["captions"] as! [[String:String]]
for (i,c) in captions.enumerated(){
    image("caption-\(i)"){
        // Same panel as Web recording: left 36, center at 32%, 520 square, scaled 1.5x.
        let r=NSRect(x:54,y:1920-224-780,width:780,height:780)
        NSColor(calibratedWhite:0.025,alpha:0.45).setFill();NSBezierPath(roundedRect:r,xRadius:20,yRadius:20).fill()
        NSColor.white.withAlphaComponent(0.3).setStroke();let border=NSBezierPath(roundedRect:r,xRadius:20,yRadius:20);border.lineWidth=2;border.stroke()
        text(c["main"]!,rect:NSRect(x:114,y:r.minY+300,width:660,height:360),size:69,color:.white)
        text(c["sub"] ?? "",rect:NSRect(x:114,y:r.minY+110,width:660,height:180),size:42,color:.lightGray)
    }
}
for (i,t) in [start,goal,"6HOPS"].enumerated(){
 image("outro-\(i)"){
    NSColor(calibratedRed:0.06,green:0.07,blue:0.06,alpha:1).setFill();NSRect(x:0,y:0,width:1080,height:1920).fill()
    text(t,rect:NSRect(x:100,y:400,width:880,height:1120),size:180,color:NSColor(calibratedRed:0.85,green:0.87,blue:0.83,alpha:1))
    NSColor.black.withAlphaComponent(0.24).setFill()
    for y in stride(from:0,to:1920,by:7){NSRect(x:0,y:CGFloat(y),width:1080,height:2).fill()}
 }
}
image("black"){NSColor.black.setFill();NSRect(x:0,y:0,width:1080,height:1920).fill()}
