import graphviz

# 创建图形对象
dot = graphviz.Digraph('BeneBook系统流程图', comment='BeneBook项目架构与流程', 
                      format='png', engine='dot')
dot.attr(rankdir='TB', size='11,8', dpi='300')
dot.attr('node', shape='box', style='filled', fillcolor='lightblue', fontname='Microsoft YaHei')
dot.attr('edge', fontname='Microsoft YaHei')

# 添加标题
dot.attr(label='BeneBook系统流程图', fontsize='24', fontname='Microsoft YaHei')

# 创建子图：系统架构
with dot.subgraph(name='cluster_architecture') as c:
    c.attr(label='系统架构', style='filled', fillcolor='lightyellow', fontname='Microsoft YaHei')
    
    # 前端节点
    c.node('frontend', '前端\n(EJS模板引擎)', shape='component')
    
    # 后端节点
    c.node('backend', '后端\n(Node.js + Express)', shape='component')
    
    # 数据库节点
    c.node('database', '数据库\n(MySQL)', shape='cylinder')
    
    # 添加连接
    c.edge('frontend', 'backend', label='HTTP请求')
    c.edge('backend', 'frontend', label='渲染页面')
    c.edge('backend', 'database', label='查询/存储数据')
    c.edge('database', 'backend', label='返回数据')

# 创建子图：用户注册/登录流程
with dot.subgraph(name='cluster_login') as c:
    c.attr(label='用户注册/登录流程', style='filled', fillcolor='lightcyan', fontname='Microsoft YaHei')
    
    c.node('input_phone', '输入手机号')
    c.node('verify_user', '验证用户信息')
    c.node('create_user', '创建用户记录')
    c.node('redirect_home', '重定向到首页')
    
    c.edge('input_phone', 'verify_user')
    c.edge('verify_user', 'create_user')
    c.edge('create_user', 'redirect_home')

# 创建子图：书籍捐赠流程
with dot.subgraph(name='cluster_donation') as c:
    c.attr(label='书籍捐赠流程', style='filled', fillcolor='lightpink', fontname='Microsoft YaHei')
    
    c.node('book_info', '填写书籍信息')
    c.node('submit_donation', '提交捐赠表单')
    c.node('save_book', '保存书籍信息')
    c.node('record_donation', '记录捐赠信息')
    c.node('update_points', '更新用户积分')
    c.node('thank_letter', '生成环保感谢信')
    
    c.edge('book_info', 'submit_donation')
    c.edge('submit_donation', 'save_book')
    c.edge('save_book', 'record_donation')
    c.edge('record_donation', 'update_points')
    c.edge('record_donation', 'thank_letter')

# 创建子图：积分兑换流程
with dot.subgraph(name='cluster_redemption') as c:
    c.attr(label='积分兑换流程', style='filled', fillcolor='lightgreen', fontname='Microsoft YaHei')
    
    c.node('browse_rewards', '浏览奖励商品')
    c.node('select_item', '选择兑换物品')
    c.node('submit_redemption', '提交兑换请求')
    c.node('verify_points', '验证积分余额')
    c.node('record_redemption', '记录兑换信息')
    c.node('deduct_points', '扣减用户积分')
    c.node('reduce_stock', '减少物品库存')
    
    c.edge('browse_rewards', 'select_item')
    c.edge('select_item', 'submit_redemption')
    c.edge('submit_redemption', 'verify_points')
    c.edge('verify_points', 'record_redemption')
    c.edge('record_redemption', 'deduct_points')
    c.edge('deduct_points', 'reduce_stock')

# 创建子图：数据库设计
with dot.subgraph(name='cluster_database') as c:
    c.attr(label='数据库设计', style='filled', fillcolor='lavender', fontname='Microsoft YaHei')
    
    c.node('book_table', 'Book表\n(书籍信息)', shape='folder')
    c.node('donor_table', 'Donor表\n(捐赠者信息)', shape='folder')
    c.node('donation_table', 'Donation表\n(捐赠记录)', shape='folder')
    c.node('reward_table', 'RewardItem表\n(奖励物品)', shape='folder')
    c.node('redemption_table', 'Redemption表\n(兑换记录)', shape='folder')
    c.node('config_table', 'SystemConfig表\n(系统配置)', shape='folder')
    c.node('letter_table', 'ThankYouLetter表\n(感谢信)', shape='folder')
    
    c.edge('donor_table', 'donation_table')
    c.edge('book_table', 'donation_table')
    c.edge('donation_table', 'letter_table')
    c.edge('donor_table', 'redemption_table')
    c.edge('reward_table', 'redemption_table')
    c.edge('config_table', 'letter_table', label='环保数据计算')

# 添加全局连接
dot.edge('redirect_home', 'browse_rewards', style='dashed')
dot.edge('update_points', 'browse_rewards', style='dashed', label='积分可用于兑换')

# 渲染并保存图像
dot.render('benebook_flowchart', view=True, cleanup=True)

print("流程图已保存为 'benebook_flowchart.png'") 