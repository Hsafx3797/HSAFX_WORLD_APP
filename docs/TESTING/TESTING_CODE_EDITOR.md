# Data Format

## **CSV to JSON**
input
```
id,name,age,is_active,join_date,salary
1,John Doe,29,true,2023-01-15,50000
2,Jane Smith,34,false,2022-11-20,62000
3,Ali Khan,41,true,2021-05-02,72000
4,Maria Lopez,27,true,2023-07-10,48000
5,Chen Wei,36,false,2020-03-25,80000
```
output
```
[
  {
    "id": "1",
    "name": "John Doe",
    "age": "29",
    "is_active": "true",
    "join_date": "2023-01-15",
    "salary": "50000"
  },
  {
    "id": "2",
    "name": "Jane Smith",
    "age": "34",
    "is_active": "false",
    "join_date": "2022-11-20",
    "salary": "62000"
  },
  {
    "id": "3",
    "name": "Ali Khan",
    "age": "41",
    "is_active": "true",
    "join_date": "2021-05-02",
    "salary": "72000"
  },
  {
    "id": "4",
    "name": "Maria Lopez",
    "age": "27",
    "is_active": "true",
    "join_date": "2023-07-10",
    "salary": "48000"
  },
  {
    "id": "5",
    "name": "Chen Wei",
    "age": "36",
    "is_active": "false",
    "join_date": "2020-03-25",
    "salary": "80000"
  }
]
```
## **JSON to CSV**
input
```
[
  {
    "id": 1,
    "name": "John Doe",
    "age": 29,
    "is_active": true,
    "join_date": "2023-01-15",
    "salary": 50000
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "age": 34,
    "is_active": false,
    "join_date": "2022-11-20",
    "salary": 62000
  },
  {
    "id": 3,
    "name": "Ali Khan",
    "age": 41,
    "is_active": true,
    "join_date": "2021-05-02",
    "salary": 72000
  },
  {
    "id": 4,
    "name": "Maria Lopez",
    "age": 27,
    "is_active": true,
    "join_date": "2023-07-10",
    "salary": 48000
  },
  {
    "id": 5,
    "name": "Chen Wei",
    "age": 36,
    "is_active": false,
    "join_date": "2020-03-25",
    "salary": 80000
  }
]
```
output
```
"id","name","age","is_active","join_date","salary"
"1","John Doe","29","true","2023-01-15","50000"
"2","Jane Smith","34","false","2022-11-20","62000"
"3","Ali Khan","41","true","2021-05-02","72000"
"4","Maria Lopez","27","true","2023-07-10","48000"
"5","Chen Wei","36","false","2020-03-25","80000"
```
## **XML to JSON**
input
```
<library>
  <book id="101">
    <title>The Hobbit</title>
    <author>J.R.R. Tolkien</author>
  </book>
  <book id="102">
    <title>Dune</title>
    <author>Frank Herbert</author>
  </book>
</library>

<shopping>
  <item>
    <name>Milk</name>
    <qty>2</qty>
  </item>
  <item>
    <name>Bread</name>
    <qty>1</qty>
  </item>
  <item>
    <name>Eggs</name>
    <qty>12</qty>
  </item>
</shopping>
```
output
```
{
  "library": {
    "book": [
      {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "@_id": 101
      },
      {
        "title": "Dune",
        "author": "Frank Herbert",
        "@_id": 102
      }
    ]
  },
  "shopping": {
    "item": [
      {
        "name": "Milk",
        "qty": 2
      },
      {
        "name": "Bread",
        "qty": 1
      },
      {
        "name": "Eggs",
        "qty": 12
      }
    ]
  }
}
```
## **JSON to XML**
input
```
{
  "company": "TechCorp",
  "employees": [
    {
      "id": 1,
      "name": "Bob",
      "role": "Engineer"
    },
    {
      "id": 2,
      "name": "Sara",
      "role": "Designer"
    }
  ]
}
```
output
```
<company>TechCorp</company>
<employees>
  <id>1</id>
  <name>Bob</name>
  <role>Engineer</role>
</employees>
<employees>
  <id>2</id>
  <name>Sara</name>
  <role>Designer</role>
</employees>
```
## **YAML to JSON**
input
```
company:
  name: Tech Corp
  employees:
    - name: Alice
      role: Developer
      skills:
        - Python
        - FastAPI
        - PostgreSQL
    - name: Bob
      role: Designer
      skills:
        - Figma
        - Photoshop
        - Illustrator
location:
  country: USA
  offices:
    - city: New York
      headcount: 120
    - city: San Francisco
      headcount: 80
```
output
```
{
  "company": {
    "name": "Tech Corp",
    "employees": [
      {
        "name": "Alice",
        "role": "Developer",
        "skills": [
          "Python",
          "FastAPI",
          "PostgreSQL"
        ]
      },
      {
        "name": "Bob",
        "role": "Designer",
        "skills": [
          "Figma",
          "Photoshop",
          "Illustrator"
        ]
      }
    ]
  },
  "location": {
    "country": "USA",
    "offices": [
      {
        "city": "New York",
        "headcount": 120
      },
      {
        "city": "San Francisco",
        "headcount": 80
      }
    ]
  }
}
```
## **JSON to YAML**
input
```
{
  "id": 101,
  "name": "Test User",
  "email": "test.user@example.com",
  "is_active": true,
  "roles": ["admin", "editor", "viewer"],
  "profile": {
    "age": 29,
    "country": "Pakistan",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "sms": false
      }
    }
  },
  "projects": [
    {
      "id": "p001",
      "name": "Project Alpha",
      "status": "in-progress"
    },
    {
      "id": "p002",
      "name": "Project Beta",
      "status": "completed"
    }
  ]
}
```
output
```
id: 101
name: Test User
email: test.user@example.com
is_active: true
roles:
  - admin
  - editor
  - viewer
profile:
  age: 29
  country: Pakistan
  preferences:
    theme: dark
    notifications:
      email: true
      sms: false
projects:
  - id: p001
    name: Project Alpha
    status: in-progress
  - id: p002
    name: Project Beta
    status: completed
```
## **TOML to JSON**
input
```
title = "Config Example"

[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true

[servers.alpha]
ip = "10.0.0.1"
dc = "eqdc10"

[servers.beta]
ip = "10.0.0.2"
dc = "eqdc20"
```
output
```
{
  "title": "Config Example",
  "database": {
    "server": "192.168.1.1",
    "ports": [
      8001,
      8001,
      8002
    ],
    "connection_max": 5000,
    "enabled": true
  },
  "servers": {
    "alpha": {
      "ip": "10.0.0.1",
      "dc": "eqdc10"
    },
    "beta": {
      "ip": "10.0.0.2",
      "dc": "eqdc20"
    }
  }
}
```
## **JSON to TOML**
input
```
{
  "title": "Config Example",
  "database": {
    "server": "192.168.1.1",
    "ports": [8001, 8001, 8002],
    "connection_max": 5000,
    "enabled": true
  },
  "servers": {
    "alpha": {
      "ip": "10.0.0.1",
      "dc": "eqdc10"
    },
    "beta": {
      "ip": "10.0.0.2",
      "dc": "eqdc20"
    }
  }
}
```
output
```
title = "Config Example"

[database]
server = "192.168.1.1"
ports = [ 8_001, 8_001, 8_002 ]
connection_max = 5_000
enabled = true

[servers.alpha]
ip = "10.0.0.1"
dc = "eqdc10"

[servers.beta]
ip = "10.0.0.2"
dc = "eqdc20"
```
## **INI to JSON**
input
```
[general]
app_name = MyApp
version = 1.2.3
debug = true

[database]
host = localhost
port = 5432
user = admin
password = secret

[features]
logging = yes
caching = no
max_connections = 100
```
output
```
{
  "general": {
    "app_name": "MyApp",
    "version": "1.2.3",
    "debug": true
  },
  "database": {
    "host": "localhost",
    "port": "5432",
    "user": "admin",
    "password": "secret"
  },
  "features": {
    "logging": "yes",
    "caching": "no",
    "max_connections": "100"
  }
}
```
## **JSON to INI**
input
```
{
  "general": {
    "app_name": "MyApp",
    "version": "1.2.3",
    "debug": "true"
  },
  "database": {
    "host": "localhost",
    "port": "5432",
    "user": "admin",
    "password": "secret"
  },
  "features": {
    "logging": "yes",
    "caching": "no",
    "max_connections": "100"
  }
}
```
output
```
[DEFAULT.general]
app_name = MyApp
version = 1.2.3
debug = true

[DEFAULT.database]
host = localhost
port = 5432
user = admin
password = secret

[DEFAULT.features]
logging = yes
caching = no
max_connections = 100
```
## **Parquet to JSON**
input
```
| id | name    | age | active | balance |
| -- | ------- | --- | ------ | ------- |
| 1  | Alice   | 30  | true   | 1020.55 |
| 2  | Bob     | 45  | false  | 0.00    |
| 3  | Charlie | 28  | true   | 550.10  |
```
output
```
[
  {
    "id": 1,
    "name": "Alice",
    "age": 30,
    "active": true,
    "balance": 1020.55
  },
  {
    "id": 2,
    "name": "Bob",
    "age": 45,
    "active": false,
    "balance": 0
  },
  {
    "id": 3,
    "name": "Charlie",
    "age": 28,
    "active": true,
    "balance": 550.1
  }
]
```
## **JSON to Parquet**
input
```
[
  {
    "id": 1,
    "name": "Alice",
    "age": 30,
    "active": true,
    "balance": 1020.55
  },
  {
    "id": 2,
    "name": "Bob",
    "age": 45,
    "active": false,
    "balance": 0.0
  },
  {
    "id": 3,
    "name": "Charlie",
    "age": 28,
    "active": true,
    "balance": 550.1
  }
]
```
output
```
| id | name | age | active | balance |
| -- | -- | -- | -- | -- |
| 1 | Alice | 30 | true | 1020.55 |
| 2 | Bob | 45 | false | 0 |
| 3 | Charlie | 28 | true | 550.1 |
```

##

# Encoder & Decoder

## **URL Encode**
input
```
https://example.com/search?q=hello world&lang=en#section-2
```
output
```
https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den%23section-2
```
## **URL Decode**
input
```
https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den%23section-2
```
output
```
https://example.com/search?q=hello world&lang=en#section-2
```
## **Base64 Encode**
input
```
Line1
Line2
Line3
```
output
```
TGluZTEKTGluZTIKTGluZTM=
```
## **Base64 Decode**
input
```
TGluZTEKTGluZTIKTGluZTM=
```
output
```
Line1
Line2
Line3
```
## **Base32 Encode**
input
```
"hello world"
```
output
```
EJUGK3DMN4QHO33SNRSCE===
```
## **Base32 Decode**
input
```
EJUGK3DMN4QHO33SNRSCE===
```
output
```
"hello world"
```
## **HTML Entity Encode**
input
```
[
  {"id":"basic-ampersand","input":"Tom & Jerry","expected":"Tom &amp; Jerry"},
  {"id":"basic-lt-gt","input":"5 < 10 > 2","expected":"5 &lt; 10 &gt; 2"},
  {"id":"quotes-double","input":"She said \"Hello\"","expected":"She said &quot;Hello&quot;"},
  {"id":"quotes-single","input":"It\\'s ok","expected":"It&#39;s ok"},
  {"id":"slash-and-backslash","input":"path/to\\file","expected":"path/to\\file","notes":"slashes/backslashes do not need entity-encoding for HTML text; keep as-is"},
  {"id":"angle-brackets-tag","input":"<script>alert('x')</script>","expected":"&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;","notes":"neutralize tags and quotes"},
  {"id":"already-encoded","input":"&lt;div&gt;Hello&lt;/div&gt;","expected":"&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;","notes":"encoder should not leave existing entities — choose either idempotent or preserve behavior; this expected assumes plain re-encoding"},
  {"id":"double-encoding-safe","input":"Tom &amp; Jerry","expected":"Tom &amp;amp; Jerry","notes":"tests whether encoder double-encodes entities"},
  {"id":"non-ascii-europe","input":"café & crème","expected":"caf&eacute; &amp; cr&egrave;me"},
  {"id":"emoji","input":"I ❤️ HTML","expected":"I ❤️ HTML","notes":"emojis (U+1F497) are valid in UTF-8 — optional to encode as numeric entity: &#x1F497;"},
  {"id":"nbsp","input":"Hello\u00A0World","expected":"Hello&nbsp;World","notes":"non-breaking space often encoded as &nbsp;"},
  {"id":"control-chars","input":"Line1\r\nLine2\tEnd","expected":"Line1\r\nLine2\tEnd","notes":"preserve control characters or convert to visible escapes depending on policy; HTML encoding usually leaves them"},
  {"id":"mixed-with-amp","input":"5 &lt; x & y > 2","expected":"5 &amp;lt; x &amp; y &gt; 2","notes":"tests mixed literal ampersands and named entities"},
  {"id":"attribute-double-quoted","input":"a\"b<c&d","expected":"a&amp;quot;b&lt;c&amp;amp;d","notes":"expected here assumes encoding for inclusion inside double-quoted attribute; some encoders prefer &quot; for \" and &amp; for & (order matters)"},
  {"id":"attribute-single-quoted","input":"o'brien <img> & ok","expected":"o&#39;brien &lt;img&gt; &amp; ok","notes":"suitable for single-quoted attribute values"},
  {"id":"url-like","input":"https://example.com/?q=a&b=<script>","expected":"https://example.com/?q=a&amp;b=&lt;script&gt;","notes":"encode before injecting into HTML text; if inserted into URL context different handling required"},
  {"id":"script-injection-encoded","input":"</script><img src=x onerror=alert(1)>","expected":"&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;","notes":"should neutralize tag boundaries; attributes inside will still be visible if inserted as text"},
  {"id":"cdata-like","input":"<![CDATA[<notatag>]]>","expected":"&lt;![CDATA[&lt;notatag&gt;]]&gt;"},
  {"id":"math-and-symbols","input":"© ® ™ < > &","expected":"&copy; &reg; &trade; &lt; &gt; &amp;"},
  {"id":"combining-diacritics","input":"e\u0301 = é","expected":"e\u0301 = &eacute;","notes":"some encoders normalize to composed codepoint (&eacute;); others keep combining sequence"},
  {"id":"surrogate-pair","input":"G clef: \uD834\uDD1E","expected":"G clef: &#x1D11E;","notes":"encode astral-plane chars as numeric entity to be safe in limited encodings"},
  {"id":"long-text","input":"<p>" + "A".repeat(1000) + "</p>","expected":"&lt;p&gt;" + "A".repeat(1000) + "&lt;/p&gt;"},
  {"id":"empty-string","input":"","expected":""},
  {"id":"whitespace-only","input":"   \t\n","expected":"   \t\n","notes":"preserve whitespace unless normalization required"},
  {"id":"mixed-language","input":"中文 & عربى <tag>","expected":"中文 &amp; عربى &lt;tag&gt;"},
  {"id":"markdown-like","input":"**bold** <em>italic</em> & text","expected":"**bold** &lt;em&gt;italic&lt;/em&gt; &amp; text","notes":"ensure markup characters in text are encoded"},
  {"id":"json-in-html","input":"{\"key\": \"<value>&\"}","expected":"{&quot;key&quot;: &quot;&lt;value&gt;&amp;&quot;}","notes":"useful for embedding JSON in HTML safely"}
]
```
output
```
[
  {&quot;id&quot;:&quot;basic-ampersand&quot;,&quot;input&quot;:&quot;Tom &amp; Jerry&quot;,&quot;expected&quot;:&quot;Tom &amp;amp; Jerry&quot;},
  {&quot;id&quot;:&quot;basic-lt-gt&quot;,&quot;input&quot;:&quot;5 &lt; 10 &gt; 2&quot;,&quot;expected&quot;:&quot;5 &amp;lt; 10 &amp;gt; 2&quot;},
  {&quot;id&quot;:&quot;quotes-double&quot;,&quot;input&quot;:&quot;She said \&quot;Hello\&quot;&quot;,&quot;expected&quot;:&quot;She said &amp;quot;Hello&amp;quot;&quot;},
  {&quot;id&quot;:&quot;quotes-single&quot;,&quot;input&quot;:&quot;It\\&apos;s ok&quot;,&quot;expected&quot;:&quot;It&amp;#39;s ok&quot;},
  {&quot;id&quot;:&quot;slash-and-backslash&quot;,&quot;input&quot;:&quot;path/to\\file&quot;,&quot;expected&quot;:&quot;path/to\\file&quot;,&quot;notes&quot;:&quot;slashes/backslashes do not need entity-encoding for HTML text; keep as-is&quot;},
  {&quot;id&quot;:&quot;angle-brackets-tag&quot;,&quot;input&quot;:&quot;&lt;script&gt;alert(&apos;x&apos;)&lt;/script&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;script&amp;gt;alert(&amp;#39;x&amp;#39;)&amp;lt;/script&amp;gt;&quot;,&quot;notes&quot;:&quot;neutralize tags and quotes&quot;},
  {&quot;id&quot;:&quot;already-encoded&quot;,&quot;input&quot;:&quot;&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;&quot;,&quot;expected&quot;:&quot;&amp;amp;lt;div&amp;amp;gt;Hello&amp;amp;lt;/div&amp;amp;gt;&quot;,&quot;notes&quot;:&quot;encoder should not leave existing entities &mdash; choose either idempotent or preserve behavior; this expected assumes plain re-encoding&quot;},
  {&quot;id&quot;:&quot;double-encoding-safe&quot;,&quot;input&quot;:&quot;Tom &amp;amp; Jerry&quot;,&quot;expected&quot;:&quot;Tom &amp;amp;amp; Jerry&quot;,&quot;notes&quot;:&quot;tests whether encoder double-encodes entities&quot;},
  {&quot;id&quot;:&quot;non-ascii-europe&quot;,&quot;input&quot;:&quot;caf&eacute; &amp; cr&egrave;me&quot;,&quot;expected&quot;:&quot;caf&amp;eacute; &amp;amp; cr&amp;egrave;me&quot;},
  {&quot;id&quot;:&quot;emoji&quot;,&quot;input&quot;:&quot;I &#x2764;&#xFE0F; HTML&quot;,&quot;expected&quot;:&quot;I &#x2764;&#xFE0F; HTML&quot;,&quot;notes&quot;:&quot;emojis (U+1F497) are valid in UTF-8 &mdash; optional to encode as numeric entity: &amp;#x1F497;&quot;},
  {&quot;id&quot;:&quot;nbsp&quot;,&quot;input&quot;:&quot;Hello\u00A0World&quot;,&quot;expected&quot;:&quot;Hello&amp;nbsp;World&quot;,&quot;notes&quot;:&quot;non-breaking space often encoded as &amp;nbsp;&quot;},
  {&quot;id&quot;:&quot;control-chars&quot;,&quot;input&quot;:&quot;Line1\r\nLine2\tEnd&quot;,&quot;expected&quot;:&quot;Line1\r\nLine2\tEnd&quot;,&quot;notes&quot;:&quot;preserve control characters or convert to visible escapes depending on policy; HTML encoding usually leaves them&quot;},
  {&quot;id&quot;:&quot;mixed-with-amp&quot;,&quot;input&quot;:&quot;5 &amp;lt; x &amp; y &gt; 2&quot;,&quot;expected&quot;:&quot;5 &amp;amp;lt; x &amp;amp; y &amp;gt; 2&quot;,&quot;notes&quot;:&quot;tests mixed literal ampersands and named entities&quot;},
  {&quot;id&quot;:&quot;attribute-double-quoted&quot;,&quot;input&quot;:&quot;a\&quot;b&lt;c&amp;d&quot;,&quot;expected&quot;:&quot;a&amp;amp;quot;b&amp;lt;c&amp;amp;amp;d&quot;,&quot;notes&quot;:&quot;expected here assumes encoding for inclusion inside double-quoted attribute; some encoders prefer &amp;quot; for \&quot; and &amp;amp; for &amp; (order matters)&quot;},
  {&quot;id&quot;:&quot;attribute-single-quoted&quot;,&quot;input&quot;:&quot;o&apos;brien &lt;img&gt; &amp; ok&quot;,&quot;expected&quot;:&quot;o&amp;#39;brien &amp;lt;img&amp;gt; &amp;amp; ok&quot;,&quot;notes&quot;:&quot;suitable for single-quoted attribute values&quot;},
  {&quot;id&quot;:&quot;url-like&quot;,&quot;input&quot;:&quot;https://example.com/?q=a&amp;b=&lt;script&gt;&quot;,&quot;expected&quot;:&quot;https://example.com/?q=a&amp;amp;b=&amp;lt;script&amp;gt;&quot;,&quot;notes&quot;:&quot;encode before injecting into HTML text; if inserted into URL context different handling required&quot;},
  {&quot;id&quot;:&quot;script-injection-encoded&quot;,&quot;input&quot;:&quot;&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;/script&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt;&quot;,&quot;notes&quot;:&quot;should neutralize tag boundaries; attributes inside will still be visible if inserted as text&quot;},
  {&quot;id&quot;:&quot;cdata-like&quot;,&quot;input&quot;:&quot;&lt;![CDATA[&lt;notatag&gt;]]&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;![CDATA[&amp;lt;notatag&amp;gt;]]&amp;gt;&quot;},
  {&quot;id&quot;:&quot;math-and-symbols&quot;,&quot;input&quot;:&quot;&copy; &reg; &trade; &lt; &gt; &amp;&quot;,&quot;expected&quot;:&quot;&amp;copy; &amp;reg; &amp;trade; &amp;lt; &amp;gt; &amp;amp;&quot;},
  {&quot;id&quot;:&quot;combining-diacritics&quot;,&quot;input&quot;:&quot;e\u0301 = &eacute;&quot;,&quot;expected&quot;:&quot;e\u0301 = &amp;eacute;&quot;,&quot;notes&quot;:&quot;some encoders normalize to composed codepoint (&amp;eacute;); others keep combining sequence&quot;},
  {&quot;id&quot;:&quot;surrogate-pair&quot;,&quot;input&quot;:&quot;G clef: \uD834\uDD1E&quot;,&quot;expected&quot;:&quot;G clef: &amp;#x1D11E;&quot;,&quot;notes&quot;:&quot;encode astral-plane chars as numeric entity to be safe in limited encodings&quot;},
  {&quot;id&quot;:&quot;long-text&quot;,&quot;input&quot;:&quot;&lt;p&gt;&quot; + &quot;A&quot;.repeat(1000) + &quot;&lt;/p&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;p&amp;gt;&quot; + &quot;A&quot;.repeat(1000) + &quot;&amp;lt;/p&amp;gt;&quot;},
  {&quot;id&quot;:&quot;empty-string&quot;,&quot;input&quot;:&quot;&quot;,&quot;expected&quot;:&quot;&quot;},
  {&quot;id&quot;:&quot;whitespace-only&quot;,&quot;input&quot;:&quot;   \t\n&quot;,&quot;expected&quot;:&quot;   \t\n&quot;,&quot;notes&quot;:&quot;preserve whitespace unless normalization required&quot;},
  {&quot;id&quot;:&quot;mixed-language&quot;,&quot;input&quot;:&quot;&#x4E2D;&#x6587; &amp; &#x639;&#x631;&#x628;&#x649; &lt;tag&gt;&quot;,&quot;expected&quot;:&quot;&#x4E2D;&#x6587; &amp;amp; &#x639;&#x631;&#x628;&#x649; &amp;lt;tag&amp;gt;&quot;},
  {&quot;id&quot;:&quot;markdown-like&quot;,&quot;input&quot;:&quot;**bold** &lt;em&gt;italic&lt;/em&gt; &amp; text&quot;,&quot;expected&quot;:&quot;**bold** &amp;lt;em&amp;gt;italic&amp;lt;/em&amp;gt; &amp;amp; text&quot;,&quot;notes&quot;:&quot;ensure markup characters in text are encoded&quot;},
  {&quot;id&quot;:&quot;json-in-html&quot;,&quot;input&quot;:&quot;{\&quot;key\&quot;: \&quot;&lt;value&gt;&amp;\&quot;}&quot;,&quot;expected&quot;:&quot;{&amp;quot;key&amp;quot;: &amp;quot;&amp;lt;value&amp;gt;&amp;amp;&amp;quot;}&quot;,&quot;notes&quot;:&quot;useful for embedding JSON in HTML safely&quot;}
]
```
## **HTML Entity Decode**
input
```
[
  {&quot;id&quot;:&quot;basic-ampersand&quot;,&quot;input&quot;:&quot;Tom &amp; Jerry&quot;,&quot;expected&quot;:&quot;Tom &amp;amp; Jerry&quot;},
  {&quot;id&quot;:&quot;basic-lt-gt&quot;,&quot;input&quot;:&quot;5 &lt; 10 &gt; 2&quot;,&quot;expected&quot;:&quot;5 &amp;lt; 10 &amp;gt; 2&quot;},
  {&quot;id&quot;:&quot;quotes-double&quot;,&quot;input&quot;:&quot;She said \&quot;Hello\&quot;&quot;,&quot;expected&quot;:&quot;She said &amp;quot;Hello&amp;quot;&quot;},
  {&quot;id&quot;:&quot;quotes-single&quot;,&quot;input&quot;:&quot;It\\&apos;s ok&quot;,&quot;expected&quot;:&quot;It&amp;#39;s ok&quot;},
  {&quot;id&quot;:&quot;slash-and-backslash&quot;,&quot;input&quot;:&quot;path/to\\file&quot;,&quot;expected&quot;:&quot;path/to\\file&quot;,&quot;notes&quot;:&quot;slashes/backslashes do not need entity-encoding for HTML text; keep as-is&quot;},
  {&quot;id&quot;:&quot;angle-brackets-tag&quot;,&quot;input&quot;:&quot;&lt;script&gt;alert(&apos;x&apos;)&lt;/script&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;script&amp;gt;alert(&amp;#39;x&amp;#39;)&amp;lt;/script&amp;gt;&quot;,&quot;notes&quot;:&quot;neutralize tags and quotes&quot;},
  {&quot;id&quot;:&quot;already-encoded&quot;,&quot;input&quot;:&quot;&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;&quot;,&quot;expected&quot;:&quot;&amp;amp;lt;div&amp;amp;gt;Hello&amp;amp;lt;/div&amp;amp;gt;&quot;,&quot;notes&quot;:&quot;encoder should not leave existing entities &mdash; choose either idempotent or preserve behavior; this expected assumes plain re-encoding&quot;},
  {&quot;id&quot;:&quot;double-encoding-safe&quot;,&quot;input&quot;:&quot;Tom &amp;amp; Jerry&quot;,&quot;expected&quot;:&quot;Tom &amp;amp;amp; Jerry&quot;,&quot;notes&quot;:&quot;tests whether encoder double-encodes entities&quot;},
  {&quot;id&quot;:&quot;non-ascii-europe&quot;,&quot;input&quot;:&quot;caf&eacute; &amp; cr&egrave;me&quot;,&quot;expected&quot;:&quot;caf&amp;eacute; &amp;amp; cr&amp;egrave;me&quot;},
  {&quot;id&quot;:&quot;emoji&quot;,&quot;input&quot;:&quot;I &#x2764;&#xFE0F; HTML&quot;,&quot;expected&quot;:&quot;I &#x2764;&#xFE0F; HTML&quot;,&quot;notes&quot;:&quot;emojis (U+1F497) are valid in UTF-8 &mdash; optional to encode as numeric entity: &amp;#x1F497;&quot;},
  {&quot;id&quot;:&quot;nbsp&quot;,&quot;input&quot;:&quot;Hello\u00A0World&quot;,&quot;expected&quot;:&quot;Hello&amp;nbsp;World&quot;,&quot;notes&quot;:&quot;non-breaking space often encoded as &amp;nbsp;&quot;},
  {&quot;id&quot;:&quot;control-chars&quot;,&quot;input&quot;:&quot;Line1\r\nLine2\tEnd&quot;,&quot;expected&quot;:&quot;Line1\r\nLine2\tEnd&quot;,&quot;notes&quot;:&quot;preserve control characters or convert to visible escapes depending on policy; HTML encoding usually leaves them&quot;},
  {&quot;id&quot;:&quot;mixed-with-amp&quot;,&quot;input&quot;:&quot;5 &amp;lt; x &amp; y &gt; 2&quot;,&quot;expected&quot;:&quot;5 &amp;amp;lt; x &amp;amp; y &amp;gt; 2&quot;,&quot;notes&quot;:&quot;tests mixed literal ampersands and named entities&quot;},
  {&quot;id&quot;:&quot;attribute-double-quoted&quot;,&quot;input&quot;:&quot;a\&quot;b&lt;c&amp;d&quot;,&quot;expected&quot;:&quot;a&amp;amp;quot;b&amp;lt;c&amp;amp;amp;d&quot;,&quot;notes&quot;:&quot;expected here assumes encoding for inclusion inside double-quoted attribute; some encoders prefer &amp;quot; for \&quot; and &amp;amp; for &amp; (order matters)&quot;},
  {&quot;id&quot;:&quot;attribute-single-quoted&quot;,&quot;input&quot;:&quot;o&apos;brien &lt;img&gt; &amp; ok&quot;,&quot;expected&quot;:&quot;o&amp;#39;brien &amp;lt;img&amp;gt; &amp;amp; ok&quot;,&quot;notes&quot;:&quot;suitable for single-quoted attribute values&quot;},
  {&quot;id&quot;:&quot;url-like&quot;,&quot;input&quot;:&quot;https://example.com/?q=a&amp;b=&lt;script&gt;&quot;,&quot;expected&quot;:&quot;https://example.com/?q=a&amp;amp;b=&amp;lt;script&amp;gt;&quot;,&quot;notes&quot;:&quot;encode before injecting into HTML text; if inserted into URL context different handling required&quot;},
  {&quot;id&quot;:&quot;script-injection-encoded&quot;,&quot;input&quot;:&quot;&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;/script&amp;gt;&amp;lt;img src=x onerror=alert(1)&amp;gt;&quot;,&quot;notes&quot;:&quot;should neutralize tag boundaries; attributes inside will still be visible if inserted as text&quot;},
  {&quot;id&quot;:&quot;cdata-like&quot;,&quot;input&quot;:&quot;&lt;![CDATA[&lt;notatag&gt;]]&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;![CDATA[&amp;lt;notatag&amp;gt;]]&amp;gt;&quot;},
  {&quot;id&quot;:&quot;math-and-symbols&quot;,&quot;input&quot;:&quot;&copy; &reg; &trade; &lt; &gt; &amp;&quot;,&quot;expected&quot;:&quot;&amp;copy; &amp;reg; &amp;trade; &amp;lt; &amp;gt; &amp;amp;&quot;},
  {&quot;id&quot;:&quot;combining-diacritics&quot;,&quot;input&quot;:&quot;e\u0301 = &eacute;&quot;,&quot;expected&quot;:&quot;e\u0301 = &amp;eacute;&quot;,&quot;notes&quot;:&quot;some encoders normalize to composed codepoint (&amp;eacute;); others keep combining sequence&quot;},
  {&quot;id&quot;:&quot;surrogate-pair&quot;,&quot;input&quot;:&quot;G clef: \uD834\uDD1E&quot;,&quot;expected&quot;:&quot;G clef: &amp;#x1D11E;&quot;,&quot;notes&quot;:&quot;encode astral-plane chars as numeric entity to be safe in limited encodings&quot;},
  {&quot;id&quot;:&quot;long-text&quot;,&quot;input&quot;:&quot;&lt;p&gt;&quot; + &quot;A&quot;.repeat(1000) + &quot;&lt;/p&gt;&quot;,&quot;expected&quot;:&quot;&amp;lt;p&amp;gt;&quot; + &quot;A&quot;.repeat(1000) + &quot;&amp;lt;/p&amp;gt;&quot;},
  {&quot;id&quot;:&quot;empty-string&quot;,&quot;input&quot;:&quot;&quot;,&quot;expected&quot;:&quot;&quot;},
  {&quot;id&quot;:&quot;whitespace-only&quot;,&quot;input&quot;:&quot;   \t\n&quot;,&quot;expected&quot;:&quot;   \t\n&quot;,&quot;notes&quot;:&quot;preserve whitespace unless normalization required&quot;},
  {&quot;id&quot;:&quot;mixed-language&quot;,&quot;input&quot;:&quot;&#x4E2D;&#x6587; &amp; &#x639;&#x631;&#x628;&#x649; &lt;tag&gt;&quot;,&quot;expected&quot;:&quot;&#x4E2D;&#x6587; &amp;amp; &#x639;&#x631;&#x628;&#x649; &amp;lt;tag&amp;gt;&quot;},
  {&quot;id&quot;:&quot;markdown-like&quot;,&quot;input&quot;:&quot;**bold** &lt;em&gt;italic&lt;/em&gt; &amp; text&quot;,&quot;expected&quot;:&quot;**bold** &amp;lt;em&amp;gt;italic&amp;lt;/em&amp;gt; &amp;amp; text&quot;,&quot;notes&quot;:&quot;ensure markup characters in text are encoded&quot;},
  {&quot;id&quot;:&quot;json-in-html&quot;,&quot;input&quot;:&quot;{\&quot;key\&quot;: \&quot;&lt;value&gt;&amp;\&quot;}&quot;,&quot;expected&quot;:&quot;{&amp;quot;key&amp;quot;: &amp;quot;&amp;lt;value&amp;gt;&amp;amp;&amp;quot;}&quot;,&quot;notes&quot;:&quot;useful for embedding JSON in HTML safely&quot;}
]
```
output
```
[
  {"id":"basic-ampersand","input":"Tom & Jerry","expected":"Tom &amp; Jerry"},
  {"id":"basic-lt-gt","input":"5 < 10 > 2","expected":"5 &lt; 10 &gt; 2"},
  {"id":"quotes-double","input":"She said \"Hello\"","expected":"She said &quot;Hello&quot;"},
  {"id":"quotes-single","input":"It\\'s ok","expected":"It&#39;s ok"},
  {"id":"slash-and-backslash","input":"path/to\\file","expected":"path/to\\file","notes":"slashes/backslashes do not need entity-encoding for HTML text; keep as-is"},
  {"id":"angle-brackets-tag","input":"<script>alert('x')</script>","expected":"&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;","notes":"neutralize tags and quotes"},
  {"id":"already-encoded","input":"&lt;div&gt;Hello&lt;/div&gt;","expected":"&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;","notes":"encoder should not leave existing entities — choose either idempotent or preserve behavior; this expected assumes plain re-encoding"},
  {"id":"double-encoding-safe","input":"Tom &amp; Jerry","expected":"Tom &amp;amp; Jerry","notes":"tests whether encoder double-encodes entities"},
  {"id":"non-ascii-europe","input":"café & crème","expected":"caf&eacute; &amp; cr&egrave;me"},
  {"id":"emoji","input":"I ❤️ HTML","expected":"I ❤️ HTML","notes":"emojis (U+1F497) are valid in UTF-8 — optional to encode as numeric entity: &#x1F497;"},
  {"id":"nbsp","input":"Hello\u00A0World","expected":"Hello&nbsp;World","notes":"non-breaking space often encoded as &nbsp;"},
  {"id":"control-chars","input":"Line1\r\nLine2\tEnd","expected":"Line1\r\nLine2\tEnd","notes":"preserve control characters or convert to visible escapes depending on policy; HTML encoding usually leaves them"},
  {"id":"mixed-with-amp","input":"5 &lt; x & y > 2","expected":"5 &amp;lt; x &amp; y &gt; 2","notes":"tests mixed literal ampersands and named entities"},
  {"id":"attribute-double-quoted","input":"a\"b<c&d","expected":"a&amp;quot;b&lt;c&amp;amp;d","notes":"expected here assumes encoding for inclusion inside double-quoted attribute; some encoders prefer &quot; for \" and &amp; for & (order matters)"},
  {"id":"attribute-single-quoted","input":"o'brien <img> & ok","expected":"o&#39;brien &lt;img&gt; &amp; ok","notes":"suitable for single-quoted attribute values"},
  {"id":"url-like","input":"https://example.com/?q=a&b=<script>","expected":"https://example.com/?q=a&amp;b=&lt;script&gt;","notes":"encode before injecting into HTML text; if inserted into URL context different handling required"},
  {"id":"script-injection-encoded","input":"</script><img src=x onerror=alert(1)>","expected":"&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;","notes":"should neutralize tag boundaries; attributes inside will still be visible if inserted as text"},
  {"id":"cdata-like","input":"<![CDATA[<notatag>]]>","expected":"&lt;![CDATA[&lt;notatag&gt;]]&gt;"},
  {"id":"math-and-symbols","input":"© ® ™ < > &","expected":"&copy; &reg; &trade; &lt; &gt; &amp;"},
  {"id":"combining-diacritics","input":"e\u0301 = é","expected":"e\u0301 = &eacute;","notes":"some encoders normalize to composed codepoint (&eacute;); others keep combining sequence"},
  {"id":"surrogate-pair","input":"G clef: \uD834\uDD1E","expected":"G clef: &#x1D11E;","notes":"encode astral-plane chars as numeric entity to be safe in limited encodings"},
  {"id":"long-text","input":"<p>" + "A".repeat(1000) + "</p>","expected":"&lt;p&gt;" + "A".repeat(1000) + "&lt;/p&gt;"},
  {"id":"empty-string","input":"","expected":""},
  {"id":"whitespace-only","input":"   \t\n","expected":"   \t\n","notes":"preserve whitespace unless normalization required"},
  {"id":"mixed-language","input":"中文 & عربى <tag>","expected":"中文 &amp; عربى &lt;tag&gt;"},
  {"id":"markdown-like","input":"**bold** <em>italic</em> & text","expected":"**bold** &lt;em&gt;italic&lt;/em&gt; &amp; text","notes":"ensure markup characters in text are encoded"},
  {"id":"json-in-html","input":"{\"key\": \"<value>&\"}","expected":"{&quot;key&quot;: &quot;&lt;value&gt;&amp;&quot;}","notes":"useful for embedding JSON in HTML safely"}
]
```
## **Hex Encode**
input
```
"A"
"AB"
"Hello"
"Hello, World!"
"ChatGPT 5 is awesome."
"12345"
"0xFFEE"
"@#$%^&*()"
"😀🚀🔥"
""
" "
"\n\t\r"
"\x00\x01\x02\xFF"
```
output
```
2241220a224142220a2248656c6c6f220a2248656c6c6f2c20576f726c6421220a2243686174475054203520697320617765736f6d652e220a223132333435220a22307846464545220a22402324255e262a2829220a22f09f9880f09f9a80f09f94a5220a22220a2220220a225c6e5c745c72220a225c7830305c7830315c7830325c78464622
```
## **Hex Decode**
input
```
2241220a224142220a2248656c6c6f220a2248656c6c6f2c20576f726c6421220a2243686174475054203520697320617765736f6d652e220a223132333435220a22307846464545220a22402324255e262a2829220a22f09f9880f09f9a80f09f94a5220a22220a2220220a225c6e5c745c72220a225c7830305c7830315c7830325c78464622
```
output
```
"A"
"AB"
"Hello"
"Hello, World!"
"ChatGPT 5 is awesome."
"12345"
"0xFFEE"
"@#$%^&*()"
"😀🚀🔥"
""
" "
"\n\t\r"
"\x00\x01\x02\xFF"
```
## **Binary to Hex**
input
```
11111111111111111111111111111111
```
output
```
FFFFFFFF
```
## **Hex to Binary**
input
```
FFFFFFFF
```
output
```
11111111111111111111111111111111
```
##


# Document

## **Markdown to HTML**
input
```
# Heading 1
## Heading 2
### Heading 3

This is a **bold** word, this is *italic*, and this is ***bold italic***.  
You can also do ~~strikethrough~~.

---

Here’s a [link](https://example.com) and an inline image:  
![Alt text](https://via.placeholder.com/150 "Placeholder Image")

> Blockquote with **bold text** inside.  
> Second line of the quote.

---

- Unordered list item 1
- Unordered list item 2
  - Nested item
    - Sub-nested item

1. Ordered item 1
2. Ordered item 2
   1. Sub item A
   2. Sub item B

---

Inline `code` example, and a fenced code block:

```python
def hello(name):
    return f"Hello, {name}!"
````

---

| Table | Example  | Here |
| ----- | -------- | ---- |
| Row 1 | **Bold** | 123  |
| Row 2 | *Italic* | 456  |

---
---

Automatic URL: [https://openai.com](https://openai.com)

```

output
```
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<p>This is a <strong>bold</strong> word, this is <em>italic</em>, and this is <em><strong>bold italic</strong></em>.<br>You can also do <del>strikethrough</del>.</p>
<hr>
<p>Here’s a <a href="https://example.com">link</a> and an inline image:<br><img src="https://via.placeholder.com/150" alt="Alt text" title="Placeholder Image"></p>
<blockquote>
<p>Blockquote with <strong>bold text</strong> inside.<br>Second line of the quote.</p>
</blockquote>
<hr>
<ul>
<li>Unordered list item 1</li>
<li>Unordered list item 2<ul>
<li>Nested item<ul>
<li>Sub-nested item</li>
</ul>
</li>
</ul>
</li>
</ul>
<ol>
<li>Ordered item 1</li>
<li>Ordered item 2<ol>
<li>Sub item A</li>
<li>Sub item B</li>
</ol>
</li>
</ol>
<hr>
<p>Inline <code>code</code> example, and a fenced code block:</p>
<pre><code class="language-python">def hello(name):
    return f&quot;Hello, {name}!&quot;
</code></pre>
<hr>
<table>
<thead>
<tr>
<th>Table</th>
<th>Example</th>
<th>Here</th>
</tr>
</thead>
<tbody><tr>
<td>Row 1</td>
<td><strong>Bold</strong></td>
<td>123</td>
</tr>
<tr>
<td>Row 2</td>
<td><em>Italic</em></td>
<td>456</td>
</tr>
</tbody></table>
<hr>
<hr>
<p>Automatic URL: <a href="https://openai.com">https://openai.com</a></p>

```


## **HTML to Markdown**
input
```
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<p>This is a <strong>bold</strong> word, this is <em>italic</em>, and this is <em><strong>bold italic</strong></em>.<br>You can also do <del>strikethrough</del>.</p>
<hr>
<p>Here’s a <a href="https://example.com">link</a> and an inline image:<br><img src="https://via.placeholder.com/150" alt="Alt text" title="Placeholder Image"></p>
<blockquote>
<p>Blockquote with <strong>bold text</strong> inside.<br>Second line of the quote.</p>
</blockquote>
<hr>
<ul>
<li>Unordered list item 1</li>
<li>Unordered list item 2<ul>
<li>Nested item<ul>
<li>Sub-nested item</li>
</ul>
</li>
</ul>
</li>
</ul>
<ol>
<li>Ordered item 1</li>
<li>Ordered item 2<ol>
<li>Sub item A</li>
<li>Sub item B</li>
</ol>
</li>
</ol>
<hr>
<p>Inline <code>code</code> example, and a fenced code block:</p>
<pre><code class="language-python">def hello(name):
    return f&quot;Hello, {name}!&quot;
</code></pre>
<hr>
<table>
<thead>
<tr>
<th>Table</th>
<th>Example</th>
<th>Here</th>
</tr>
</thead>
<tbody><tr>
<td>Row 1</td>
<td><strong>Bold</strong></td>
<td>123</td>
</tr>
<tr>
<td>Row 2</td>
<td><em>Italic</em></td>
<td>456</td>
</tr>
</tbody></table>
<hr>
<hr>
<p>Automatic URL: <a href="https://openai.com">https://openai.com</a></p>
```

output
```
# Heading 1

## Heading 2

### Heading 3

This is a **bold** word, this is *italic*, and this is ***bold italic***.
You can also do strikethrough.

Here’s a [link](https://example.com) and an inline image:
![Alt text](https://via.placeholder.com/150)

Blockquote with **bold text** inside.
Second line of the quote.

- Unordered list item 1

Unordered list item 2
Nested item
- Sub-nested item

- Ordered item 1

Ordered item 2
- Sub item A

- Sub item B

Inline `code` example, and a fenced code block:

def hello(name):
    return f"Hello, {name}!"

Table
Example
Here

Row 1
**Bold**
123

Row 2
*Italic*
456

Automatic URL: [https://openai.com](https://openai.com)
```
## **TSV to CSV**
input
```
id	name	age	country
1	Alice	30	USA
2	Bob	25	Canada
3	Charlie	35	UK
4	Diana	28	Australia
5	Eric	40	Germany
```
output
```
id,name,age,country
1,Alice,30,USA
2,Bob,25,Canada
3,Charlie,35,UK
4,Diana,28,Australia
5,Eric,40,Germany
```
## **CSV to TSV**
input
```
id,name,age,country
1,Alice,30,USA
2,Bob,25,Canada
3,Charlie,35,UK
4,Diana,28,Australia
5,Eric,40,Germany
```
output
```
id	name	age	country
1	Alice	30	USA
2	Bob	25	Canada
3	Charlie	35	UK
4	Diana	28	Australia
5	Eric	40	Germany
```
## **LaTeX to HTML**
input
```
\section{Conclusion}
In conclusion, this converter should handle:
\begin{itemize}
  \item Text formatting
  \item Math: $a^2 + b^2 = c^2$
  \item Tables and lists
  \item Figures and references
\end{itemize}
```
output
```
<h1>Conclusion</h1>
In conclusion, this converter should handle:
<ul>
  <li>Text formatting</li>
  <li>Math: <span class="math-inline"><span class="math-inline">\(a^2 + b^2 = c^2\)</span></span></li>
  <li>Tables and lists</li>
  <li>Figures and references</li>
</ul>
```
## **HTML to laTeX**
input
```
<h1>Conclusion</h1>
In conclusion, this converter should handle:
<ul>
  <li> Text formatting
  <li> Math: <span class="math-inline">a^2 + b^2 = c^2</span>
  <li> Tables and lists
  <li> Figures and references
</ul>
```
output
```
\documentclass{article}
\begin{document}

\section{Conclusion}
In conclusion, this converter should handle:
\begin{itemize}
  \item Text formatting
  \item Math: $a^2 + b^2 = c^2\$
  \item Tables and lists
  \item Figures and references
\end{itemize}

\end{document}
```
## **RST to HTML**
input
```
Links & Code
------------

Visit the `Python website <https://www.python.org>`_.

.. image:: https://www.python.org/static/community_logos/python-logo.png
   :alt: Python Logo
   :width: 200px

Code Block::

    def hello():
        print("Hello, reST!")
```
output
```
<!DOCTYPE html>
<html>
<body>

<h2>Links & Code</h2>
<p>Visit the `Python website <https://www.python.org>`_.</p>
<img src="https://www.python.org/static/community_logos/python-logo.png" alt="Python Logo" width="200px">
<p>Code Block</p>
<pre><code>def hello():
    print("Hello, reST!")
</code></pre>

</body>
</html>
```
## **HTML to RST**
input
```
<p><h2>Links & Code</h2></p><p>Visit the <a href="https://www.python.org">Python website</a>.</p><p>.. image:: https://www.python.org/static/community_logos/python-logo.png
   :alt: Python Logo
   :width: 200px</p><p>Code Block::</p><p>    def hello():
        print("Hello, reST!")</p>
```
output
```
Links & Code
------------

Visit the `Python website `_.

.. image:: https://www.python.org/static/community_logos/python-logo.png
   :alt: Python Logo
   :width: 200px

Code Block::

    def hello():
        print("Hello, reST!")
```
##

# Minifier

## **Minify HTML**
input
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>  Complex Test  </title>
    <style>
      /* comment */
      body { margin: 0; padding:0; }
    </style>
    <!--[if IE 8]><link rel="stylesheet" href="ie8.css"><![endif]-->
  </head>
  <body>
    <header><h1>Site</h1></header>
    <main>
      <section>
        <p>  Some text    with   extra  spaces </p>
        <pre>   keep   this   exact   </pre>
      </section>
      <script>
        // JS comment
        var arr=[1,2,3];/*block*/
        console.log(arr.join(","));
      </script>
    </main>
    <footer>
      <img src="logo.png" alt="">
    </footer>
  </body>
</html>
```
output
```
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Complex Test</title><style>body{margin:0;padding:0}</style><!--[if IE 8]><link rel="stylesheet" href="ie8.css"><![endif]--></head><body><header><h1>Site</h1></header><main><section><p>Some text with extra spaces</p><pre>   keep   this   exact   </pre></section><script>var arr=[1,2,3];console.log(arr.join(","))</script></main><footer><img src="logo.png" alt=""></footer></body></html>
```
## **Minify CSS**
input
```
/* Main container */
.container {
    width: 100%;
    height: auto;
    padding: 20px 30px;
    margin: 0 auto;    /* center align */
    background-color: #ffffff;
    background-color: white; /* duplicate to test */
}

/* Typography */
h1, h2, h3 {
    font-family: "Arial", sans-serif;
    font-weight: 700;
    color: #333333;
    line-height: 1.5;
}

/* Buttons */
.btn-primary {
    display: inline-block;
    padding: 10px 20px;
    border: 1px solid #007bff;
    background: #007bff;
    color: #fff;
    text-decoration: none;
    transition: all 0.3s ease-in-out;
}

.btn-primary:hover {
    background: #0056b3;
    border-color: #0056b3;
}

/* Media Query */
@media screen and (max-width: 768px) {
    .container {
        padding: 10px;
    }
    h1 {
        font-size: 18px;
    }
}
```
output
```
.container{width:100%;height:auto;padding:20px 30px;margin:0 auto;background-color:#fff}h1,h2,h3{font-family:Arial,sans-serif;font-weight:700;color:#333;line-height:1.5}.btn-primary{display:inline-block;padding:10px 20px;border:1px solid #007bff;background:#007bff;color:#fff;text-decoration:none;transition:.3s ease-in-out}.btn-primary:hover{background:#0056b3;border-color:#0056b3}@media screen and (max-width:768px){.container{padding:10px}h1{font-size:18px}}
```
## **Minify JavaScript**
input
```
// This is a test JavaScript file
function calculateTotalPrice(items, taxRate) {
    let total = 0;

    // Loop through each item
    for (let i = 0; i < items.length; i++) {
        let item = items[i];

        // Add price * quantity
        total += item.price * item.quantity;
    }

    // Apply tax
    let tax = total * taxRate;

    return total + tax;
}

// Example usage
let cart = [
    { name: "Laptop", price: 1200, quantity: 1 },
    { name: "Mouse", price: 25, quantity: 2 },
    { name: "Keyboard", price: 75, quantity: 1 }
];

console.log("Total with tax:", calculateTotalPrice(cart, 0.08));
```
output
```
function calculateTotalPrice(items,taxRate){let total=0;for(let i=0;i<items.length;i++){let item=items[i];total+=item.price*item.quantity}return total+total*taxRate}let cart=[{name:"Laptop",price:1200,quantity:1},{name:"Mouse",price:25,quantity:2},{name:"Keyboard",price:75,quantity:1}];console.log("Total with tax:",calculateTotalPrice(cart,.08));
```
## **Minify JSON**
input
```
[
  {
    "id": 1,
    "name": "John Doe",
    "age": 29,
    "is_active": true,
    "join_date": "2023-01-15",
    "salary": 50000
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "age": 34,
    "is_active": false,
    "join_date": "2022-11-20",
    "salary": 62000
  },
  {
    "id": 3,
    "name": "Ali Khan",
    "age": 41,
    "is_active": true,
    "join_date": "2021-05-02",
    "salary": 72000
  },
  {
    "id": 4,
    "name": "Maria Lopez",
    "age": 27,
    "is_active": true,
    "join_date": "2023-07-10",
    "salary": 48000
  },
  {
    "id": 5,
    "name": "Chen Wei",
    "age": 36,
    "is_active": false,
    "join_date": "2020-03-25",
    "salary": 80000
  }
]
```
output
```
[{"id":1,"name":"John Doe","age":29,"is_active":true,"join_date":"2023-01-15","salary":50000},{"id":2,"name":"Jane Smith","age":34,"is_active":false,"join_date":"2022-11-20","salary":62000},{"id":3,"name":"Ali Khan","age":41,"is_active":true,"join_date":"2021-05-02","salary":72000},{"id":4,"name":"Maria Lopez","age":27,"is_active":true,"join_date":"2023-07-10","salary":48000},{"id":5,"name":"Chen Wei","age":36,"is_active":false,"join_date":"2020-03-25","salary":80000}]
```
##

# Beautifiers

## **Beautify HTML**
input
```
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Complex Test</title><style>body{margin:0;padding:0}</style><!--[if IE 8]><link rel="stylesheet" href="ie8.css"><![endif]--></head><body><header><h1>Site</h1></header><main><section><p>Some text with extra spaces</p><pre>   keep   this   exact   </pre></section><script>var arr=[1,2,3];console.log(arr.join(","))</script></main><footer><img src="logo.png" alt=""></footer></body></html>
```
output
```
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Complex Test</title>
  <style>
    body {
      margin: 0;
      padding: 0
    }

  </style><!--[if IE 8]><link rel="stylesheet" href="ie8.css"><![endif]-->
</head>

<body>
  <header>
    <h1>Site</h1>
  </header>
  <main>
    <section>
      <p>Some text with extra spaces</p>
      <pre>   keep   this   exact   </pre>
    </section>
    <script>
      var arr = [1, 2, 3];
      console.log(arr.join(","))

    </script>
  </main>
  <footer><img src="logo.png" alt=""></footer>
</body>

</html>
```
## **Beautify CSS**
input
```
.container{width:100%;height:auto;padding:20px 30px;margin:0 auto;background-color:#fff;background-color:#fff}h1,h2,h3{font-family:Arial,sans-serif;font-weight:700;color:#333;line-height:1.5}.btn-primary{display:inline-block;padding:10px 20px;border:1px solid #007bff;background:#007bff;color:#fff;text-decoration:none;transition:all .3s ease-in-out}.btn-primary:hover{background:#0056b3;border-color:#0056b3}@media screen and (max-width:768px){.container{padding:10px}h1{font-size:18px}}
```
output
```
.container {
  width: 100%;
  height: auto;
  padding: 20px 30px;
  margin: 0 auto;
  background-color: #fff;
  background-color: #fff
}

h1,
h2,
h3 {
  font-family: Arial, sans-serif;
  font-weight: 700;
  color: #333;
  line-height: 1.5
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  border: 1px solid #007bff;
  background: #007bff;
  color: #fff;
  text-decoration: none;
  transition: all .3s ease-in-out
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3
}

@media screen and (max-width:768px) {
  .container {
    padding: 10px
  }

  h1 {
    font-size: 18px
  }
}
```
## **Beautify JavaScript**
input
```
function calculateTotalPrice(t,e){let a=0;for(let e=0;e<t.length;e++){let c=t[e];a+=c.price*c.quantity}return a+a*e}let cart=[{name:"Laptop",price:1200,quantity:1},{name:"Mouse",price:25,quantity:2},{name:"Keyboard",price:75,quantity:1}];console.log("Total with tax:",calculateTotalPrice(cart,.08));
```
output
```
function calculateTotalPrice(t, e) {
  let a = 0;
  for (let e = 0; e < t.length; e++) {
    let c = t[e];
    a += c.price * c.quantity
  }
  return a + a * e
}
let cart = [{
  name: "Laptop",
  price: 1200,
  quantity: 1
}, {
  name: "Mouse",
  price: 25,
  quantity: 2
}, {
  name: "Keyboard",
  price: 75,
  quantity: 1
}];
console.log("Total with tax:", calculateTotalPrice(cart, .08));
```
## **JSON Formatter**
input
```
{
  "user": {
    "id": 12345,
    "name": "Alice",
    "email": "alice@example.com",
    "is_active": true,
    "roles": ["admin", "editor", "viewer"],
    "profile": {
      "age": 29,
      "address": {
        "street": "42 Example Street",
        "city": "Testville",
        "postal_code": "12345"
      },
      "phones": [
        {"type": "mobile", "number": "+1-555-1234"},
        {"type": "home", "number": "+1-555-5678"}
      ]
    }
  },
  "last_login": "2025-09-28T10:30:00Z",
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```
output
```
{
  "user": {
    "id": 12345,
    "name": "Alice",
    "email": "alice@example.com",
    "is_active": true,
    "roles": [
      "admin",
      "editor",
      "viewer"
    ],
    "profile": {
      "age": 29,
      "address": {
        "street": "42 Example Street",
        "city": "Testville",
        "postal_code": "12345"
      },
      "phones": [
        {
          "type": "mobile",
          "number": "+1-555-1234"
        },
        {
          "type": "home",
          "number": "+1-555-5678"
        }
      ]
    }
  },
  "last_login": "2025-09-28T10:30:00Z",
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```
## **XML Formatter**
input
```
<library>
    <book id="1">
        <title>1984</title>
        <author>George Orwell</author>
    </book>
    <book id="2">
        <title>Brave New World</title>
        <author>Aldous Huxley</author>
    </book>
</library>
```
output
```
<library>
  <book id="1">
    <title>
      1984
    </title>
    <author>
      George Orwell
    </author>
  </book>
  <book id="2">
    <title>
      Brave New World
    </title>
    <author>
      Aldous Huxley
    </author>
  </book>
</library>
```
## **YAML Formatter**
input
```
message: "Hello,
 World!"
description: >
   This is a long description
   that should be formatted into
   a single line when parsed.
note: |
   Line 1 stays
   Line 2 stays
   Line 3 stays
```
output
```
message: Hello, World!
description: >
  This is a long description that should be formatted into a single line when
  parsed.
note: |
  Line 1 stays
  Line 2 stays
  Line 3 stays
```
## **SQL Formatter**
input
```
SELECT c.country, COUNT(u.id) as users, SUM(o.total) revenue FROM users u join countries c on u.country_id=c.id left join orders o on u.id=o.user_id group by c.country having revenue>10000 order by revenue desc;
```
output
```
SELECT c.country, COUNT(u.id) as users, SUM(o.total) revenue
FROM users u
JOIN countries c
ON u.country_id=c.id left
JOIN orders o
ON u.id=o.user_id
GROUP BY c.country
HAVING revenue>10000
ORDER BY revenue desc;
```
## **GraphSQL Schema Formatter**
input
```
type User{id:ID! name:String email:String!posts:[Post]createdAt:DateTime!}
type Post{ id:ID! title:String! content:String author:User! comments:[Comment]}
type Comment{ id:ID! text:String author:User! post:Post!}
enum Role{ADMIN USER GUEST}
input NewUserInput{ name:String! email:String! role:Role=USER}
```
output
```
type User {
id:ID!
name:String
email:String!
posts:[Post]
createdAt:DateTime!
}
type Post {
id:ID!
title:String!
content:String
author:User!
comments:[Comment]
}
type Comment {
id:ID!
text:String
author:User!
post:Post!
}
enum Role {
ADMIN USER GUEST
}
input NewUserInput {
name:String!
email:String!
role:Role=USER
}
```
## **OpenAPI/Swagger Formatter**
input
```
openapi: 3.0.0
info:
  title: Sample Todo API
  version: 1.0.0
  description: >
    A small test API to manage todos.  
    Used for testing OpenAPI/Swagger formatters.

servers:
  - url: https://api.example.com/v1

paths:
  /todos:
    get:
      summary: Get all todos
      responses:
        '200':
          description: A list of todos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'

    post:
      summary: Create a new todo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewTodo'
      responses:
        '201':
          description: Todo created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'

  /todos/{id}:
    get:
      summary: Get a single todo by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A todo item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          description: Todo not found

    delete:
      summary: Delete a todo by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Todo deleted
        '404':
          description: Todo not found

components:
  schemas:
    Todo:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        completed:
          type: boolean
      required: [id, title, completed]

    NewTodo:
      type: object
      properties:
        title:
          type: string
        completed:
          type: boolean
      required: [title]
```
output
```
openapi: 3.0.0
info:
  title: Sample Todo API
  version: 1.0.0
  description: |
    A small test API to manage todos.   Used for testing OpenAPI/Swagger formatters.
servers:
  - url: https://api.example.com/v1
paths:
  /todos:
    get:
      summary: Get all todos
      responses:
        '200':
          description: A list of todos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
    post:
      summary: Create a new todo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewTodo'
      responses:
        '201':
          description: Todo created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
  /todos/{id}:
    get:
      summary: Get a single todo by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A todo item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          description: Todo not found
    delete:
      summary: Delete a todo by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Todo deleted
        '404':
          description: Todo not found
components:
  schemas:
    Todo:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        completed:
          type: boolean
      required:
        - id
        - title
        - completed
    NewTodo:
      type: object
      properties:
        title:
          type: string
        completed:
          type: boolean
      required:
        - title
```
## **API Response Formatter**
input
```
{
  "orderId": 5501,
  "customer": {
    "name": "Charlie",
    "contact": { "email": "charlie@shop.com", "phone": null }
  },
  "items": [
    { "sku": "P100", "qty": 2, "price": 15.5 },
    { "sku": "P200", "qty": 1, "price": 40.0 }
  ],
  "total": 71.0,
  "currency": "USD",
  "paid": false
}
```
output
```
{
  "orderId": 5501,
  "customer": {
    "name": "Charlie",
    "contact": {
      "email": "charlie@shop.com",
      "phone": null
    }
  },
  "items": [
    {
      "sku": "P100",
      "qty": 2,
      "price": 15.5
    },
    {
      "sku": "P200",
      "qty": 1,
      "price": 40
    }
  ],
  "total": 71,
  "currency": "USD",
  "paid": false
}
```
##

# Validator

## **CSV Validator**
input
```
id,name,email,age,active
1,John Doe,john@example.com,29,true
2,Jane Smith,jane@example.com,34,false
3,Bob Lee,bob@example.com,41,true
```

output
```
✓ Valid CSV
• 4 rows
• 5 columns
• No errors detected
```
## **JSON Validator**
input
```
{
  "id": 101,
  "name": "Alice",
  "active": true,
  "roles": ["admin", "editor"],
  "profile": {
    "age": 29,
    "email": "alice@example.com"
  }
}
```
output
```
✓ Valid JSON
• Type: Object
• Keys: 5
• Size: 152 characters
```
## **XML Validator**
input
```
<library>
  <book id="1" available="true">
    <title>XML Basics</title>
    <author>Jane Doe</author>
  </book>
  <book id="2" available="false">
    <title>Advanced XML</title>
    <author>John Smith</author>
  </book>
</library>
```
output
```
✓ Valid XML
• 7 elements
• Well-formed
• Size: 231 characters
```
## **YAML Validator**
input
```
# List of objects
products:
  - id: 1
    name: Laptop
    price: 1200
  - id: 2
    name: Phone
    price: 800

```
output
```
✓ Valid YAML
• Type: Object
• Well-formed
• Size: 111 characters
```
##

# Language Transpilers

## **TypeScript to JavaScript**
input
```
// test-mixed.js
function sumAll(...numbers: any) {
  return numbers.reduce((acc, val) => acc + val, 0);
}

const config = {
  retries: 3,
  timeout: null,
  options: ["fast", "safe"],
};

function withCallback(value: any, callback: any) {
  setTimeout(() => callback(value * 2), 1000);
}

withCallback(5, result => console.log("Callback result:", result));
```
output
```
// test-mixed.js
function sumAll(...numbers) {
  return numbers.reduce((acc, val) => acc + val, 0);
}

const config = {
  retries
  timeout
  options: ["fast", "safe"],
};

function withCallback(value, callback) {
  setTimeout(() => callback(value * 2), 1000);
}

withCallback(5, result => console.log("Callback result:", result));
```
## **JavaScript to TypeScript**
input
```
// test-mixed.js
function sumAll(...numbers) {
  return numbers.reduce((acc, val) => acc + val, 0);
}

const config = {
  retries: 3,
  timeout: null,
  options: ["fast", "safe"],
};

function withCallback(value, callback) {
  setTimeout(() => callback(value * 2), 1000);
}

withCallback(5, result => console.log("Callback result:", result));
```
output
```
// test-mixed.js
function sumAll(...numbers: any) : any {
  return numbers.reduce((acc: any, val: any) => acc + val, 0);
}

const config = {
  retries: 3,
  timeout: null,
  options: ["fast", "safe"],
};

function withCallback(value: any, callback: any) : any {
  setTimeout((: any) => callback(value * 2), 1000);
}

withCallback(5, result => console.log("Callback result:", result));
```
## **CoffeeScript to JavaScript**
input
```
# CoffeeScript Example

# Variables and arithmetic
name = "Alice"
age = 25
greeting = "Hello, #{name}! You are #{age} years old."

# Arrays and objects
numbers = [1, 2, 3, 4, 5]
person =
  name: "Bob"
  age: 30

# Functions and default parameters
square = (x = 2) -> x * x

# Conditionals
if age > 18
  console.log "#{name} is an adult."
else
  console.log "#{name} is a minor."

# Loops
for num in numbers
  console.log square(num)

# Class
class Animal
  constructor: (@name) ->
  speak: -> console.log "#{@name} makes a sound."

class Dog extends Animal
  speak: -> console.log "#{@name} barks!"

dog = new Dog("Rex")
dog.speak()

```
output
```
// CoffeeScript Example

// Variables and arithmetic
function name("Alice"
age = 25
greeting = `Hello, ${name}! You are #{age} years old.`

// Arrays and objects
numbers = [1, 2, 3, 4, 5]
person =
  name: "Bob"
  age: 30

// Functions and default parameters
function square(x = 2) x * x

// Conditionals
if age > 18
  console.log `${name} is an adult.`
else
  console.log `${name} is a minor.`

// Loops
for (let num of numbers)
  console.log square(num)

// Class
class Animal {
  constructor: (this.name) )
  speak: -> console.log `${this.name} makes a sound.`

class Dog extends Animal {
  speak: -> console.log `${this.name} barks!`

dog = new Dog("Rex")
dog.speak()
```
## **JavaScript to CoffeeScript**
input
```
// Variables and arithmetic
let name = "Alice";
let age = 25;
let greeting = `Hello, ${name}! You are ${age} years old.`;

// Arrays and objects
let numbers = [1, 2, 3, 4, 5];
let person = {
  name: "Bob",
  age: 30
};

// Functions and default parameters
function square(x = 2) {
  return x * x;
}

// Conditionals
if (age > 18) {
  console.log(`${name} is an adult.`);
} else {
  console.log(`${name} is a minor.`);
}

// Loops
for (let num of numbers) {
  console.log(square(num));
}

// Classes
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a sound.`);
  }
}

class Dog extends Animal {
  speak() {
    console.log(`${this.name} barks!`);
  }
}

let dog = new Dog("Rex");
dog.speak();
```
output
```
# Variables and arithmetic
name = "Alice"
age = 25
greeting = "Hello, #{name}! You are ${age} years old."

# Arrays and objects
numbers = [1, 2, 3, 4, 5]
person =
  name: "Bob",
  age: 30

# Functions and default parameters
square = (x = 2) ->
  return x * x

# Conditionals
if (age > 18)
  console.log("#{name} is an adult.")
} else
  console.log("#{name} is a minor.")

# Loops
for (num of numbers)
  console.log(square(num))

# Classes
class Animal
  constructor(name)
    @name = name

  speak()
    console.log("#{@name} makes a sound.")


class Dog extends Animal
  speak()
    console.log("#{@name} barks!")


dog = new Dog("Rex")
dog.speak()
```
## **Dart to JavaScript**
input
```

class Person {
  String name;
  int age;

  Person(this.name, this.age);

  void greet() {
    print('Hi, my name is $name and I am $age years old.');
  }
}

void main() {
  var p = Person('Alice', 30);
  p.greet();
}

```
output
```
class Person {
  String name;
  int age;

  Person(this.name, this.age);

  void greet() {
    console.log(`Hi, my name is ${name} and I am $age years old.`);
  }
}

// main
(function() {
  let p = Person('Alice', 30);
  p.greet();
})();
```
## **JavaScript to Dart**
input
```
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    console.log(`Hi, my name is ${this.name} and I am ${this.age} years old.`);
  }
}

// main
const p = new Person("Alice", 30);
p.greet();
```
output
```
void main() {
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    print('Hi, my name is ${this.name} and I am ${this.age} years old.');
  }
}

// main
var p = new Person("Alice", 30);
p.greet();
}
```
## **Sass/SCSS to CSS**
input
```
.navbar {
  background: #222;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: inline-block;

      a {
        color: white;
        text-decoration: none;

        &:hover {
          color: yellow;
        }
      }
    }
  }
}

@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  @include flex-center;
  height: 100vh;
}

@function px-to-rem($px, $base: 16) {
  @return ($px / $base) * 1rem;
}

.title {
  font-size: px-to-rem(24);
}

.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.success {
  @extend .message;
  border-color: green;
}

.error {
  @extend .message;
  border-color: red;
}

@for $i from 1 through 3 {
  .m-#{$i} {
    margin: #{$i * 5}px;
  }
}

$theme: dark;

body {
  @if $theme == dark {
    background: #000;
    color: #fff;
  } @else {
    background: #fff;
    color: #000;
  }
}
```
output
```
.navbar {
  background: #222;
}
.navbar ul {
  margin: 0;
}
.navbar ul {
  padding: 0;
}
.navbar ul {
  list-style: none;
}
.navbar ul li {
  display: inline-block;
}
.navbar ul li a {
  color: white;
}
.navbar ul li a {
  text-decoration: none;
}
.navbar ul li a {
  color: yellow;
}
.container {
  height: 100vh;
}
.title {
  font-size: px-to-rem(24);
}
.message {
  border: 1px solid #ccc;
}
.message {
  padding: 10px;
}
.message {
  color: #333;
}
.success {
  border-color: green;
}
.error {
  border-color: red;
}
.m-#1 body {
  background: #000;
}
.m-#1 body {
  color: #fff;
}
```
## **CSS to Sass/SCSS**
input
```
.navbar {
  background: #222;
}
.navbar ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.navbar ul li {
  display: inline-block;
}
.navbar ul li a {
  color: white;
  text-decoration: none;
}
.navbar ul li a:hover {
  color: yellow;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.title {
  font-size: 1.5rem; /* 24px -> rem (24/16 = 1.5rem) */
}

.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.success {
  border: 1px solid green;
  padding: 10px;
  color: #333;
}

.error {
  border: 1px solid red;
  padding: 10px;
  color: #333;
}

/* Loop expansion */
.m-1 {
  margin: 5px;
}
.m-2 {
  margin: 10px;
}
.m-3 {
  margin: 15px;
}

/* Theme check (dark in your case) */
body {
  background: #000;
  color: #fff;
}
```
output
```
.navbar {
  background: #222;
}
  ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
  ul li {
  display: inline-block;
}
  ul li a {
  color: white;
  text-decoration: none;
}
  ul li a:hover {
  color: yellow;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.title {
  font-size: 1.5rem; /* 24px -> rem (24/16 = 1.5rem) */
}

.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.success {
  border: 1px solid green;
  padding: 10px;
  color: #333;
}

.error {
  border: 1px solid red;
  padding: 10px;
  color: #333;
}

/* Loop expansion */
.m-1 {
  margin: 5px;
}
.m-2 {
  margin: 10px;
}
.m-3 {
  margin: 15px;
}

/* Theme check (dark in your case) */
body {
  background: #000;
  color: #fff;
}
```
## **Less to CSS**
input
```
// Variables
@primary-color: #3498db;
@padding: 10px;

// Mixin
.rounded-corners(@radius: 8px) {
  border-radius: @radius;
}

// Nesting + Mixins + Variables
.card {
  background: lighten(@primary-color, 35%);
  color: darken(@primary-color, 25%);
  padding: @padding;

  h2 {
    margin: 0;
    font-size: 18px;
  }

  button {
    background: @primary-color;
    color: #fff;
    padding: @padding / 2;
    .rounded-corners(6px);

    &:hover {
      background: darken(@primary-color, 10%);
    }
  }
}
```
output
```
.card h2 {
  margin: 0;
  font-size: 18px;
}

.card button button:hover {
  background: #2d86c9;
}

.card button {
  background: #3498db;
  color: #fff;
  padding: 5px;
}

.card {
  background: #85c1e9;
  color: #1f618d;
  padding: 10px;
}
```
## **CSS to Less**
input
```
.card {
  background: #85c1e9; /* lighten(#3498db, 35%) */
  color: #1f618d;     /* darken(#3498db, 25%) */
  padding: 10px;
}

.card h2 {
  margin: 0;
  font-size: 18px;
}

.card button {
  background: #3498db;
  color: #fff;
  padding: 5px; /* 10px / 2 */
  border-radius: 6px;
}

.card button:hover {
  background: #2d86c9; /* darken(#3498db, 10%) */
}
```
output
```
// Variables
// @primary-color: #3498db;
// @padding: 10px;

.card {
  background: #85c1e9; /* lighten(#3498db, 35%) */
  color: #1f618d;     /* darken(#3498db, 25%) */
  padding: 10px;
}

.card h2 {
  margin: 0;
  font-size: 18px;
}

.card button {
  background: #3498db;
  color: #fff;
  padding: 5px; /* 10px / 2 */
  border-radius: 6px;
}

.card button:hover {
  background: #2d86c9; /* darken(#3498db, 10%) */
}
```
## **Stylus to CSS**
input
```
body
  font-family Arial, sans-serif
  background #f0f0f0

  h1
    color #333
    font-size 2rem

primary = #3498db
padding = 1rem

button
  background primary
  padding padding
  border none
  color white

rounded(corner = 4px)
  border-radius corner

.card
  rounded()
  padding 20px
  box-shadow 0 2px 4px rgba(0,0,0,0.1)

for num in (1..3)
  .m-{num}
    margin num * 5px

```
output
```
body h1 {
  color #333
  font-size 2rem
}

body {
  font-family Arial, sans-serif
  background #f0f0f0
}

button {
  background #3498db
  border none
  color white
}

.card {
  box-shadow 0 2px 4px rgba(0,0,0,0.1)
}
```
## **CSS to Stylus**
input
```
body {
  font-family: Arial, sans-serif;
  background: #f0f0f0;
}
body h1 {
  color: #333;
  font-size: 2rem;
}

button {
  background: #3498db;
  padding: 1rem;
  border: none;
  color: white;
}

.card {
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.m-1 {
  margin: 5px;
}
.m-2 {
  margin: 10px;
}
.m-3 {
  margin: 15px;
}

```
output
```
body
font-family: Arial, sans-serif
  background: #f0f0f0
body h1
color: #333
  font-size: 2rem
button
background: #3498db
  padding: 1rem
  border: none
  color: white
.card
border-radius: 4px
  padding: 20px
  box-shadow: 0 2px 4px rgba(0,0,0,0.1)
.m-1
margin: 5px
.m-2
margin: 10px
.m-3
margin: 15px
```
## 

# API Formats

## **Protocol Buffer to JSON**
input
```
id: 101
name: "Alice Johnson"
email: "alice@example.com"
phone_numbers: "123-456-7890"
phone_numbers: "987-654-3210"
address {
  street: "42 Sunset Blvd"
  city: "Los Angeles"
  country: "USA"
}
```
output
```
{
  "id": "101",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phone_numbers": [
    "123-456-7890",
    "987-654-3210"
  ],
  "address": {
    "street": "42 Sunset Blvd",
    "city": "Los Angeles",
    "country": "USA"
  }
}
```
## **JSON to Protocol Buffer**
input
```
{
  "id": 101,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phone_numbers": [
    "123-456-7890",
    "987-654-3210"
  ],
  "address": {
    "street": "42 Sunset Blvd",
    "city": "Los Angeles",
    "country": "USA"
  }
}
```
output
```
id: 101
name: "Alice Johnson"
email: "alice@example.com"
phone_numbers: "123-456-7890"
phone_numbers: "987-654-3210"
address {
  street: "42 Sunset Blvd"
  city: "Los Angeles"
  country: "USA"
}
```
## **Avro to JSON Schema**
input
```
{
  "type": "record",
  "name": "User",
  "namespace": "com.example.avro",
  "doc": "A sample Avro schema for testing Avro-to-JSON-Schema conversion.",
  "fields": [
    {
      "name": "id",
      "type": "string",
      "doc": "Unique identifier for the user"
    },
    {
      "name": "age",
      "type": ["null", "int"],
      "default": null,
      "doc": "Optional age, nullable"
    },
    {
      "name": "isActive",
      "type": "boolean",
      "default": true,
      "doc": "Whether the user is active"
    },
    {
      "name": "score",
      "type": "float",
      "doc": "User score as a float"
    },
    {
      "name": "emails",
      "type": {
        "type": "array",
        "items": "string"
      },
      "doc": "List of emails"
    },
    {
      "name": "preferences",
      "type": {
        "type": "map",
        "values": "string"
      },
      "doc": "Key-value pairs for preferences"
    },
    {
      "name": "role",
      "type": {
        "type": "enum",
        "name": "UserRole",
        "symbols": ["ADMIN", "EDITOR", "VIEWER"],
        "doc": "Role of the user"
      }
    },
    {
      "name": "address",
      "type": {
        "type": "record",
        "name": "Address",
        "fields": [
          { "name": "street", "type": "string" },
          { "name": "city", "type": "string" },
          { "name": "zip", "type": "string" }
        ]
      },
      "doc": "Nested record for address"
    }
  ]
}
```
output
```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "description": "A sample Avro schema for testing Avro-to-JSON-Schema conversion.",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "age": {
      "type": "integer"
    },
    "isActive": {
      "type": "boolean"
    },
    "score": {
      "type": "number"
    },
    "emails": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "preferences": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "role": {
      "type": "string",
      "enum": [
        "ADMIN",
        "EDITOR",
        "VIEWER"
      ]
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "zip": {
          "type": "string"
        }
      },
      "required": [
        "street",
        "city",
        "zip"
      ]
    }
  },
  "required": [
    "id",
    "isActive",
    "score",
    "emails",
    "preferences",
    "role",
    "address"
  ]
}
```
## **JSON Schema to Avro**
input
```
{
  "id": "user-123",
  "age": 28,
  "isActive": true,
  "score": 95.7,
  "emails": [
    "user@example.com",
    "alt@example.org"
  ],
  "preferences": {
    "theme": "dark",
    "notifications": "enabled"
  },
  "role": "EDITOR",
  "address": {
    "street": "123 Main St",
    "city": "Metropolis",
    "zip": "12345"
  }
}
```
output
```
{
  "type": "record",
  "name": "User",
  "namespace": "com.example.avro",
  "fields": [
    {
      "name": "id",
      "type": "string"
    },
    {
      "name": "age",
      "type": "int"
    },
    {
      "name": "isActive",
      "type": "boolean"
    },
    {
      "name": "score",
      "type": "double"
    },
    {
      "name": "emails",
      "type": {
        "type": "array",
        "items": "string"
      }
    },
    {
      "name": "preferences",
      "type": {
        "type": "record",
        "name": "PreferencesRecord",
        "fields": [
          {
            "name": "theme",
            "type": "string"
          },
          {
            "name": "notifications",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "role",
      "type": "string"
    },
    {
      "name": "address",
      "type": {
        "type": "record",
        "name": "AddressRecord",
        "fields": [
          {
            "name": "street",
            "type": "string"
          },
          {
            "name": "city",
            "type": "string"
          },
          {
            "name": "zip",
            "type": "string"
          }
        ]
      }
    }
  ]
}
```
## 

# Devops

## **Terraform to CloudFormation**
input
```
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "test_bucket" {
  bucket = "my-test-bucket-12345"
  acl    = "private"

  tags = {
    Environment = "Dev"
    Owner       = "TestUser"
  }
}

resource "aws_instance" "test_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "TestServer"
  }
}
```
output
```
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Converted from Terraform (Region: us-east-1)",
  "Resources": {
    "testbucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "my-test-bucket-12345",
        "AccessControl": "Private"
      }
    },
    "testserver": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "ami-0c55b159cbfafe1f0",
        "InstanceType": "t2.micro"
      }
    }
  }
}
```
## **Docker Compose to Kubernetes YAML**
input
```
version: "3.9"
services:
  api:
    image: myorg/api:1.0.0
    environment:
      APP_ENV: production
      REDIS_HOST: redis
    secrets:
      - api_key
    configs:
      - source: app_config
        target: /etc/app/config.yaml
    depends_on:
      - redis
    ports:
      - "5000:5000"

  redis:
    image: redis:7-alpine

secrets:
  api_key:
    file: ./secrets/api_key.txt

configs:
  app_config:
    file: ./configs/app_config.yaml

```
output
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myorg/api:1.0.0
          ports:
            - containerPort: 5000
          env:
            - name: APP_ENV
              value: production
            - name: REDIS_HOST
              value: redis
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 5000
      targetPort: 5000
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  '0': '[object Object]'
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
stringData:
  api_key: base64-encoded-value
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports: []

```
## **Kubernetes YAML to Docker Compose**
input
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myorg/api:1.0.0
          ports:
            - containerPort: 5000
          env:
            - name: APP_ENV
              value: production
            - name: REDIS_HOST
              value: redis
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 5000
      targetPort: 5000
      protocol: TCP
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  '0': '[object Object]'
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
stringData:
  api_key: base64-encoded-value
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports: []
```
output
```
version: '3.9'
services:
  api:
    image: myorg/api:1.0.0
    ports:
      - '5000:5000'
    environment:
      APP_ENV: production
      REDIS_HOST: redis
  redis:
    image: redis:7-alpine
    ports: []
    environment: {}

```
# Database Formats

## **SQL to NoSQL**
input
```
SELECT * FROM users;
```
output
```
db.users.find({});
```
input
```
SELECT id, name FROM users WHERE age > 25;
```
output
```
db.users.find({"age":{"$gt":25}}, {"id":1,"name":1});
```
input
```
INSERT INTO users (id, name, age) VALUES (1, 'Alice', 30);
```
output
```
db.users.insertOne({
  "id": 1,
  "name": "Alice",
  "age": 30
});
```
input
```
UPDATE users SET age = 31 WHERE id = 1;
```
output
```
db.users.updateOne(
  {"id":1},
  {
  "$set": {
    "age": 31
  }
}
);
```
input
```
DELETE FROM users WHERE id = 1;
```
output
```
db.users.deleteOne({"id":1});
```
input
```
SELECT users.name, orders.total
FROM users
JOIN orders ON users.id = orders.user_id;
```
output
```
db.users.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "id",
      foreignField: "user_id",
      as: "orders_data"
    }
  },
  { $unwind: "$orders_data" }
]);
```
input
```
SELECT department, COUNT(*) as total
FROM employees
GROUP BY department;
```
output
```
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      total: { $sum: 1 }
    }
  }
]);
```
input
```
SELECT * FROM products ORDER BY price DESC LIMIT 5;
```
output
```
db.products.find({}).sort({ "price": -1 }).limit(5);
```
input
```
SELECT * FROM users WHERE country IN ('US', 'UK', 'CA');
```
output
```
db.users.find({"country":{"$in":["US","UK","CA"]}});
```
input
```
SELECT * FROM sales WHERE amount BETWEEN 100 AND 500;
```
output
```
db.sales.find({"amount":{"$gte":100,"$lte":500}});
```
## **NoSQL to SQL**
input
```
db.users.find({});
```
output
```
SELECT * FROM users;
```
input
```
db.users.find({"age":{"$gt":25}}, {"id":1,"name":1});
```
output
```
SELECT id, name FROM users WHERE age > 25;
```
input
```
db.users.insertOne({
  "id": 1,
  "name": "Alice",
  "age": 30
});
```
output
```
INSERT INTO users (id, name, age) VALUES (1, 'Alice', 30);
```
input
```
db.users.updateOne(
  {"id":1},
  {
  "$set": {
    "age": 31
  }
}
);
```
output
```
UPDATE users SET age = 31 WHERE id = 1;
```
input
```
db.users.deleteOne({"id":1});
```
output
```
DELETE FROM users WHERE id = 1;
```
input
```
db.users.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "id",
      foreignField: "user_id",
      as: "orders_data"
    }
  },
  { $unwind: "$orders_data" }
]);
```
output
```
SELECT users.name, orders.total
FROM users
JOIN orders ON users.id = orders.user_id;
```
input
```
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      total: { $sum: 1 }
    }
  }
]);
```
Could not parse NoSQL query. Supported: find(), insertOne(), updateOne(), deleteOne()

output
```
SELECT department, COUNT(*) as total
FROM employees
GROUP BY department;
```
input
```
db.products.find({}).sort({ "price": -1 }).limit(5);
```
output
```
SELECT * FROM products ORDER BY price DESC LIMIT 5;
```
input
```
db.users.find({"country":{"$in":["US","UK","CA"]}});
```
output
```
SELECT * FROM users WHERE country IN ('US', 'UK', 'CA');
```
input
```
db.sales.find({"amount":{"$gte":100,"$lte":500}});
```
output
```
SELECT * FROM sales WHERE amount >= 100 AND amount <= 500;
```